'use client';

/**
 * 메인 대시보드 페이지
 * - 시간대별 약 목록 표시
 * - 체크 상태 관리 (Zustand + Server Actions)
 * - D3/MTX 주기 로직 적용
 * - 알람 설정 모달 연동
 */

import { useEffect, useState, useCallback, useTransition } from 'react';
import { Header } from '@/components/features/Header';
import { TimeCard } from '@/components/features/alarm/TimeCard';
import { MedicineItem } from '@/components/features/medicine/MedicineItem';
import { AlarmPicker } from '@/components/features/alarm/AlarmPicker';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useFcmToken } from '@/hooks/useFcmToken';
import {
  getTodayString,
  isMedicineActiveToday,
  isTodayTuesday,
} from '@/lib/utils';
import { TIME_SLOTS_CONFIG } from '@/lib/db/seed';
import type { Medicine, TimeSlot } from '@/lib/db/schema';

// Server Actions
import { getMedicinesForUser, toggleMedicineLog, getMedicineLogsForDate } from '@/server/actions/medicine';
import { toggleAlarmWithSchedule, updateAlarmTimeWithSchedule } from '@/server/actions/notification';
import { getAlarmSettings } from '@/server/actions/alarm';

// 임시 사용자 ID (추후 인증 연동)
const GUEST_USER_ID = 'b13761dc-6c80-4ef9-8b1f-44c819ff34df';

interface MedicineWithState extends Medicine {
  isActiveToday: boolean;
  effectiveSlot: string;
  dDay?: number;
}

interface AlarmSlotState {
  id: TimeSlot;
  label: string;
  time: string;
  isOn: boolean;
}

export default function HomePage() {
  const [medicines, setMedicines] = useState<MedicineWithState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlarmPickerOpen, setIsAlarmPickerOpen] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  // FCM 토큰
  const { fcmToken, permission, requestPermission } = useFcmToken();

  // Zustand Store
  const {
    slots,
    checkedMeds,
    toggleMed,
    setSlotTime,
    toggleSlot,
    hydrateFromServer,
  } = useAlarmStore();

  // 데이터 로드 (Server Actions 사용)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. 약 목록 조회
      const medicineData = await getMedicinesForUser(GUEST_USER_ID);

      // 2. 오늘 복용 기록 조회
      const today = getTodayString();
      const logsData = await getMedicineLogsForDate(GUEST_USER_ID, today);

      // 3. 알람 설정 조회
      const alarmData = await getAlarmSettings(GUEST_USER_ID);

      // 오늘 날짜 기준으로 활성화 상태 계산
      const todayDate = new Date();
      const isTuesday = isTodayTuesday(todayDate);

      const processedMeds: MedicineWithState[] = medicineData.map((med) => {
        const result = isMedicineActiveToday(med, todayDate);

        // 화요일 엽산 이동 처리
        let effectiveSlot = med.slot;
        if (med.tuesdayEvening && isTuesday) {
          effectiveSlot = 'evening';
        }

        return {
          ...med,
          isActiveToday: result.isActive,
          effectiveSlot,
          dDay: result.dDay,
        };
      });

      setMedicines(processedMeds);

      // 복용 기록으로 체크 상태 동기화
      const logsForHydrate = logsData
        .filter((log) => log.medicineId !== null && log.isTaken !== null)
        .map((log) => ({
          medicineId: log.medicineId as string,
          isTaken: log.isTaken as boolean,
          takenAt: log.takenAt?.toISOString(),
        }));

      // 알람 설정으로 슬롯 상태 동기화
      const alarmSlots: AlarmSlotState[] = TIME_SLOTS_CONFIG.map((config) => {
        const alarm = alarmData.find((a) => a.slot === config.id);
        return {
          id: config.id as TimeSlot,
          label: config.label,
          time: alarm?.alarmTime || config.defaultTime,
          isOn: alarm?.isEnabled || false,
        };
      });

      // Store 업데이트
      hydrateFromServer({
        logs: logsForHydrate,
        alarms: alarmSlots,
      });

    } catch (err) {
      console.error('Failed to load data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromServer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 약 체크 토글 (Server Action 사용)
  const handleMedicineToggle = useCallback(async (medicineId: string) => {
    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    const currentState = checkedMeds[medicineId]?.checked || false;
    toggleMed(medicineId);

    // 서버에 저장 (Server Action)
    startSaveTransition(async () => {
      try {
        const today = getTodayString();
        await toggleMedicineLog(GUEST_USER_ID, medicineId, today, !currentState);
      } catch (err) {
        console.error('Failed to save check state:', err);
        // 실패 시 롤백
        toggleMed(medicineId);
      }
    });
  }, [checkedMeds, toggleMed]);

  // 그룹(시간대) 전체 토글
  const handleGroupToggle = useCallback(async (slotId: TimeSlot) => {
    const slotMeds = medicines.filter(
      (med) => med.effectiveSlot === slotId && med.isActiveToday
    );

    // 전체가 체크되어 있으면 전체 해제, 아니면 전체 체크
    const allChecked = slotMeds.every((med) => checkedMeds[med.id]?.checked);
    const newState = !allChecked;

    // 로컬 상태 일괄 업데이트
    slotMeds.forEach((med) => {
      if (checkedMeds[med.id]?.checked !== newState) {
        toggleMed(med.id);
      }
    });

    // 서버에 일괄 저장
    startSaveTransition(async () => {
      try {
        const today = getTodayString();
        await Promise.all(
          slotMeds.map((med) =>
            toggleMedicineLog(GUEST_USER_ID, med.id, today, newState)
          )
        );
      } catch (err) {
        console.error('Failed to save group check state:', err);
      }
    });
  }, [medicines, checkedMeds, toggleMed]);

  // 알람 클릭 (설정 모달 열기)
  const handleAlarmClick = useCallback(async () => {
    // 알림 권한 체크
    if (permission !== 'granted') {
      const token = await requestPermission();
      if (!token) {
        alert('알림 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
        return;
      }
    }
    setIsAlarmPickerOpen(true);
  }, [permission, requestPermission]);

  // 알람 설정 저장
  const handleAlarmSave = useCallback(async (newSlots: AlarmSlotState[]) => {
    const currentSlots = slots;

    for (const newSlot of newSlots) {
      const oldSlot = currentSlots.find((s) => s.id === newSlot.id);
      const slotLabel = TIME_SLOTS_CONFIG.find((c) => c.id === newSlot.id)?.label || '';

      // 시간이 변경된 경우
      if (oldSlot?.time !== newSlot.time) {
        await updateAlarmTimeWithSchedule(
          GUEST_USER_ID,
          newSlot.id,
          newSlot.time,
          fcmToken,
          slotLabel
        );
        setSlotTime(newSlot.id, newSlot.time);
      }

      // ON/OFF가 변경된 경우
      if (oldSlot?.isOn !== newSlot.isOn) {
        await toggleAlarmWithSchedule(
          GUEST_USER_ID,
          newSlot.id,
          newSlot.isOn,
          fcmToken,
          slotLabel
        );
        toggleSlot(newSlot.id);
      }
    }
  }, [slots, fcmToken, setSlotTime, toggleSlot]);

  // 시간대별 약 그룹핑
  const getMedicinesBySlot = (slotId: TimeSlot) => {
    return medicines.filter((med) => {
      if (med.tuesdayEvening && isTodayTuesday()) {
        return med.effectiveSlot === slotId;
      }
      return med.slot === slotId;
    });
  };

  // 시간대 전체 체크 여부
  const isSlotAllChecked = (slotId: TimeSlot) => {
    const slotMeds = getMedicinesBySlot(slotId).filter((med) => med.isActiveToday);
    if (slotMeds.length === 0) return false;
    return slotMeds.every((med) => checkedMeds[med.id]?.checked);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-zinc-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={loadData}
            className="text-sm text-blue-500 underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header
        buildDate={new Date().toISOString()}
        onAlarmClick={handleAlarmClick}
      />

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* 시간대별 카드 */}
        {TIME_SLOTS_CONFIG.map((slotConfig) => {
          const slotId = slotConfig.id as TimeSlot;
          const slotMeds = getMedicinesBySlot(slotId);
          const alarmSlot = slots.find((s) => s.id === slotId);

          // 해당 시간대에 약이 없으면 스킵
          if (slotMeds.length === 0) return null;

          return (
            <TimeCard
              key={slotId}
              slotId={slotId}
              label={slotConfig.label}
              iconName={slotConfig.icon}
              notes={[...slotConfig.notes]}
              allChecked={isSlotAllChecked(slotId)}
              onGroupToggle={() => handleGroupToggle(slotId)}
              alarmTime={alarmSlot?.time}
              isAlarmOn={alarmSlot?.isOn || false}
              onAlarmToggle={handleAlarmClick}
            >
              {slotMeds.map((med) => {
                const isChecked = checkedMeds[med.id]?.checked || false;

                // D-Day 뱃지 (D3, MTX 모두 dDay 값 사용)
                let badgeText: string | undefined;
                if ((med.cycleType === 'D3' || med.cycleType === 'MTX') && med.dDay !== undefined) {
                  badgeText = med.dDay === 0 ? 'TODAY' : `D-${med.dDay}`;
                }

                // 주기성 약물 여부 (D3, MTX)
                const isCycleMed = med.cycleType === 'D3' || med.cycleType === 'MTX';

                return (
                  <MedicineItem
                    key={med.id}
                    id={med.id}
                    name={med.name}
                    dose={med.dose || ''}
                    checked={isChecked}
                    disabled={!med.isActiveToday}
                    isActiveToday={med.isActiveToday}
                    isDanger={med.cycleType === 'MTX'}
                    showFolicWarning={med.tuesdayEvening === true && isTodayTuesday()}
                    badge={badgeText}
                    isCycleMed={isCycleMed}
                    onChange={() => handleMedicineToggle(med.id)}
                  />
                );
              })}
            </TimeCard>
          );
        })}
      </main>

      {/* 알람 설정 모달 */}
      <AlarmPicker
        open={isAlarmPickerOpen}
        onOpenChange={setIsAlarmPickerOpen}
        slots={slots}
        onSave={handleAlarmSave}
        isLoading={isSaving}
      />
    </div>
  );
}
