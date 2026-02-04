'use server';

/**
 * 알람 설정 Server Actions
 */

import { db } from '@/lib/db';
import { alarmSettings, type AlarmSetting, type NewAlarmSetting, type TimeSlot } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { DEFAULT_ALARM_TIMES } from '@/lib/db/seed';

/**
 * 사용자의 모든 알람 설정 조회
 */
export async function getAlarmSettings(userId: string): Promise<AlarmSetting[]> {
    if (!db) {
        return [];
    }

    try {
        const result = await db
            .select()
            .from(alarmSettings)
            .where(eq(alarmSettings.userId, userId));

        return result;
    } catch (error) {
        console.error('[Action] getAlarmSettings error:', error);
        throw new Error('알람 설정을 불러오는데 실패했습니다.');
    }
}

/**
 * 알람 시간 업데이트
 */
export async function updateAlarmTime(
    userId: string,
    slot: TimeSlot,
    time: string
): Promise<AlarmSetting> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        // 기존 설정 확인
        const existing = await db
            .select()
            .from(alarmSettings)
            .where(and(eq(alarmSettings.userId, userId), eq(alarmSettings.slot, slot)));

        if (existing.length > 0) {
            const [result] = await db
                .update(alarmSettings)
                .set({ alarmTime: time, updatedAt: new Date() })
                .where(eq(alarmSettings.id, existing[0].id))
                .returning();

            return result;
        } else {
            const [result] = await db
                .insert(alarmSettings)
                .values({
                    userId,
                    slot,
                    alarmTime: time,
                    isEnabled: false,
                })
                .returning();

            return result;
        }
    } catch (error) {
        console.error('[Action] updateAlarmTime error:', error);
        throw new Error('알람 시간 저장에 실패했습니다.');
    }
}

/**
 * 알람 활성화/비활성화 토글
 */
export async function toggleAlarm(
    userId: string,
    slot: TimeSlot,
    isEnabled: boolean
): Promise<AlarmSetting> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        // 기존 설정 확인
        const existing = await db
            .select()
            .from(alarmSettings)
            .where(and(eq(alarmSettings.userId, userId), eq(alarmSettings.slot, slot)));

        if (existing.length > 0) {
            const [result] = await db
                .update(alarmSettings)
                .set({ isEnabled, updatedAt: new Date() })
                .where(eq(alarmSettings.id, existing[0].id))
                .returning();

            return result;
        } else {
            // 기본 시간으로 새 설정 생성
            const defaultTime = DEFAULT_ALARM_TIMES[slot];
            const [result] = await db
                .insert(alarmSettings)
                .values({
                    userId,
                    slot,
                    alarmTime: defaultTime,
                    isEnabled,
                })
                .returning();

            return result;
        }
    } catch (error) {
        console.error('[Action] toggleAlarm error:', error);
        throw new Error('알람 설정 저장에 실패했습니다.');
    }
}

/**
 * 사용자의 기본 알람 설정 초기화
 */
export async function initializeAlarmSettings(userId: string): Promise<AlarmSetting[]> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        const slots = Object.keys(DEFAULT_ALARM_TIMES) as TimeSlot[];

        const values = slots.map((slot) => ({
            userId,
            slot,
            alarmTime: DEFAULT_ALARM_TIMES[slot],
            isEnabled: false,
        }));

        const result = await db.insert(alarmSettings).values(values).returning();
        return result;
    } catch (error) {
        console.error('[Action] initializeAlarmSettings error:', error);
        throw new Error('알람 설정 초기화에 실패했습니다.');
    }
}
