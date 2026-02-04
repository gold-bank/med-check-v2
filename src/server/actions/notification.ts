'use server';

/**
 * 알림 스케줄링 Server Actions
 * 
 * Upstash QStash + Firebase FCM 연동
 * - scheduleNotification: 알람 예약
 * - cancelNotification: 알람 취소
 * - calculateDelay: KST 기준 딜레이 계산
 */

import { Client } from '@upstash/qstash';
import { db } from '@/lib/db';
import { alarmSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { TimeSlot } from '@/lib/db/schema';

// QStash 클라이언트
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || '',
});

/**
 * KST 기준 다음 알람까지의 딜레이(초) 계산
 */
function calculateDelayToNextAlarm(time: string): number {
  // 현재 UTC 시간
  const now = new Date();
  // KST = UTC + 9시간
  const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));

  // 목표 시간 파싱 (HH:mm)
  const [targetHour, targetMinute] = time.split(':').map(Number);

  // 목표 KST 시간 객체 생성
  const kstTarget = new Date(kstNow);
  kstTarget.setHours(targetHour, targetMinute, 0, 0);

  // 이미 지났으면 내일로 설정
  if (kstTarget.getTime() <= kstNow.getTime()) {
    kstTarget.setDate(kstTarget.getDate() + 1);
  }

  // 딜레이 계산 (초)
  const diffMs = kstTarget.getTime() - kstNow.getTime();
  const delay = Math.floor(diffMs / 1000);

  console.log(`[Notification] Time: ${time}, Delay: ${delay}s (${Math.floor(delay / 60)}min)`);

  return delay;
}

interface ScheduleResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * 알람 예약 (Upstash QStash)
 */
export async function scheduleNotification(
  fcmToken: string,
  time: string,
  slotLabel: string
): Promise<ScheduleResult> {
  if (!process.env.QSTASH_TOKEN) {
    return { success: false, error: 'QSTASH_TOKEN is not configured' };
  }

  if (!process.env.APP_URL) {
    return { success: false, error: 'APP_URL is not configured' };
  }

  if (!fcmToken || !time) {
    return { success: false, error: 'Missing fcmToken or time' };
  }

  try {
    const delay = calculateDelayToNextAlarm(time);

    // Upstash에 메시지 예약
    const result = await qstashClient.publishJSON({
      url: `${process.env.APP_URL}/api/send-notification`,
      body: {
        token: fcmToken,
        heading: '💊 복약 시간!',
        content: `${slotLabel} 약을 복용할 시간이에요.`,
      },
      delay: delay,
      retries: 0, // 중복 방지
    });

    console.log('[Notification] Scheduled:', result.messageId);

    return { success: true, notificationId: result.messageId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Notification] Schedule failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 알람 취소 (Upstash QStash)
 */
export async function cancelNotification(notificationId: string): Promise<ScheduleResult> {
  if (!notificationId) {
    console.log('[Notification] No ID to cancel, skipping');
    return { success: true };
  }

  try {
    await qstashClient.messages.delete(notificationId);
    console.log('[Notification] Cancelled:', notificationId);
    return { success: true };
  } catch (error: unknown) {
    // 이미 실행됐거나 삭제된 경우도 성공으로 처리
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[Notification] Cancel warning:', errorMessage);
    return { success: true };
  }
}

/**
 * 알람 토글 (DB 저장 + 스케줄링)
 */
export async function toggleAlarmWithSchedule(
  userId: string,
  slot: TimeSlot,
  isEnabled: boolean,
  fcmToken: string | null,
  slotLabel: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  try {
    // 기존 알람 설정 조회
    const existingAlarms = await db
      .select()
      .from(alarmSettings)
      .where(and(eq(alarmSettings.userId, userId), eq(alarmSettings.slot, slot)));

    const existingAlarm = existingAlarms[0];
    let scheduleId: string | null = null;

    if (isEnabled) {
      // 알람 켜기: 스케줄 예약
      if (!fcmToken) {
        return { success: false, error: '알림 권한이 필요합니다.' };
      }

      if (!existingAlarm?.alarmTime) {
        return { success: false, error: '알람 시간이 설정되지 않았습니다.' };
      }

      // 기존 스케줄이 있으면 먼저 취소
      if (existingAlarm?.scheduleId) {
        await cancelNotification(existingAlarm.scheduleId);
      }

      // 새 스케줄 예약
      const result = await scheduleNotification(fcmToken, existingAlarm.alarmTime, slotLabel);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      scheduleId = result.notificationId || null;
    } else {
      // 알람 끄기: 스케줄 취소
      if (existingAlarm?.scheduleId) {
        await cancelNotification(existingAlarm.scheduleId);
      }
    }

    // DB 업데이트
    if (existingAlarm) {
      await db
        .update(alarmSettings)
        .set({
          isEnabled,
          scheduleId,
          updatedAt: new Date(),
        })
        .where(eq(alarmSettings.id, existingAlarm.id));
    } else {
      // 새 알람 설정 생성 (기본 시간 사용)
      await db.insert(alarmSettings).values({
        userId,
        slot,
        alarmTime: getDefaultAlarmTime(slot),
        isEnabled,
        scheduleId,
      });
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Notification] Toggle failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 알람 시간 업데이트 (+ 스케줄 재예약)
 */
export async function updateAlarmTimeWithSchedule(
  userId: string,
  slot: TimeSlot,
  time: string,
  fcmToken: string | null,
  slotLabel: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  try {
    // 기존 알람 설정 조회
    const existingAlarms = await db
      .select()
      .from(alarmSettings)
      .where(and(eq(alarmSettings.userId, userId), eq(alarmSettings.slot, slot)));

    const existingAlarm = existingAlarms[0];
    let scheduleId: string | null = null;

    // 알람이 켜져있으면 스케줄 재예약
    if (existingAlarm?.isEnabled && fcmToken) {
      // 기존 스케줄 취소
      if (existingAlarm.scheduleId) {
        await cancelNotification(existingAlarm.scheduleId);
      }

      // 새 스케줄 예약
      const result = await scheduleNotification(fcmToken, time, slotLabel);
      scheduleId = result.notificationId || null;
    }

    // DB 업데이트
    if (existingAlarm) {
      await db
        .update(alarmSettings)
        .set({
          alarmTime: time,
          scheduleId,
          updatedAt: new Date(),
        })
        .where(eq(alarmSettings.id, existingAlarm.id));
    } else {
      await db.insert(alarmSettings).values({
        userId,
        slot,
        alarmTime: time,
        isEnabled: false,
        scheduleId: null,
      });
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Notification] Update time failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

function getDefaultAlarmTime(slot: TimeSlot): string {
  const defaults: Record<TimeSlot, string> = {
    dawn: '05:00',
    morning: '08:00',
    noon: '12:00',
    snack: '15:00',
    evening: '18:00',
    night: '22:00',
  };
  return defaults[slot];
}
