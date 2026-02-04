import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TimeSlot } from '@/lib/db/schema';
import { DEFAULT_ALARM_TIMES } from '@/lib/db/seed';

/**
 * 알람 슬롯 타입 (로컬 상태)
 */
export interface AlarmSlot {
    id: TimeSlot;
    label: string;
    time: string;
    isOn: boolean;
    scheduleId?: string; // Upstash 스케줄 ID
}

/**
 * 약 체크 상태 (로컬 캐시)
 */
export interface MedicineCheckState {
    [medicineId: string]: {
        checked: boolean;
        checkedAt?: string; // ISO 시간
    };
}

/**
 * 동기화 상태
 */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface AlarmState {
    // ===== 로컬 상태 =====
    slots: AlarmSlot[];
    checkedMeds: MedicineCheckState;
    fcmToken: string | null;

    // ===== 동기화 상태 =====
    syncStatus: SyncStatus;
    lastSyncedAt: string | null;
    userId: string | null;

    // ===== Actions: 로컬 상태 변경 =====
    setSlotTime: (slotId: TimeSlot, time: string) => void;
    toggleSlot: (slotId: TimeSlot) => void;
    toggleMed: (medId: string) => void;
    setMedChecked: (medId: string, checked: boolean) => void;
    resetAllMeds: () => void;
    resetMedsForDate: (date: string) => void;
    setFcmToken: (token: string) => void;

    // ===== Actions: 동기화 =====
    setUserId: (userId: string | null) => void;
    setSyncStatus: (status: SyncStatus) => void;
    setLastSyncedAt: (date: string) => void;

    // ===== Actions: 서버 데이터 적용 =====
    hydrateFromServer: (data: {
        alarms?: AlarmSlot[];
        logs?: { medicineId: string; isTaken: boolean; takenAt?: string }[];
    }) => void;
}

const DEFAULT_SLOTS: AlarmSlot[] = [
    { id: 'dawn', label: '새벽', time: DEFAULT_ALARM_TIMES.dawn, isOn: false },
    { id: 'morning', label: '아침', time: DEFAULT_ALARM_TIMES.morning, isOn: false },
    { id: 'noon', label: '점심', time: DEFAULT_ALARM_TIMES.noon, isOn: false },
    { id: 'snack', label: '간식', time: DEFAULT_ALARM_TIMES.snack, isOn: false },
    { id: 'evening', label: '저녁', time: DEFAULT_ALARM_TIMES.evening, isOn: false },
    { id: 'night', label: '취침', time: DEFAULT_ALARM_TIMES.night, isOn: false },
];

export const useAlarmStore = create<AlarmState>()(
    persist(
        (set, get) => ({
            // ===== 초기 상태 =====
            slots: DEFAULT_SLOTS,
            checkedMeds: {},
            fcmToken: null,
            syncStatus: 'idle',
            lastSyncedAt: null,
            userId: null,

            // ===== 로컬 상태 변경 =====
            setSlotTime: (slotId, time) =>
                set((state) => ({
                    slots: state.slots.map((slot) =>
                        slot.id === slotId ? { ...slot, time } : slot
                    ),
                })),

            toggleSlot: (slotId) =>
                set((state) => ({
                    slots: state.slots.map((slot) =>
                        slot.id === slotId ? { ...slot, isOn: !slot.isOn } : slot
                    ),
                })),

            toggleMed: (medId) =>
                set((state) => {
                    const current = state.checkedMeds[medId];
                    const newChecked = !current?.checked;

                    return {
                        checkedMeds: {
                            ...state.checkedMeds,
                            [medId]: {
                                checked: newChecked,
                                checkedAt: newChecked ? new Date().toISOString() : undefined,
                            },
                        },
                    };
                }),

            setMedChecked: (medId, checked) =>
                set((state) => ({
                    checkedMeds: {
                        ...state.checkedMeds,
                        [medId]: {
                            checked,
                            checkedAt: checked ? new Date().toISOString() : undefined,
                        },
                    },
                })),

            resetAllMeds: () =>
                set(() => ({
                    checkedMeds: {},
                })),

            resetMedsForDate: (_date) =>
                set(() => ({
                    // 현재는 단순 리셋, 추후 날짜별 관리 가능
                    checkedMeds: {},
                })),

            setFcmToken: (token) =>
                set(() => ({
                    fcmToken: token,
                })),

            // ===== 동기화 상태 =====
            setUserId: (userId) =>
                set(() => ({ userId })),

            setSyncStatus: (status) =>
                set(() => ({ syncStatus: status })),

            setLastSyncedAt: (date) =>
                set(() => ({ lastSyncedAt: date })),

            // ===== 서버 데이터 적용 =====
            hydrateFromServer: (data) => {
                set((state) => {
                    const newState: Partial<AlarmState> = {};

                    // 알람 설정 적용
                    if (data.alarms && data.alarms.length > 0) {
                        newState.slots = state.slots.map((slot) => {
                            const serverAlarm = data.alarms?.find((a) => a.id === slot.id);
                            if (serverAlarm) {
                                return {
                                    ...slot,
                                    time: serverAlarm.time,
                                    isOn: serverAlarm.isOn,
                                    scheduleId: serverAlarm.scheduleId,
                                };
                            }
                            return slot;
                        });
                    }

                    // 복용 기록 적용
                    if (data.logs && data.logs.length > 0) {
                        const newCheckedMeds: MedicineCheckState = {};
                        data.logs.forEach((log) => {
                            newCheckedMeds[log.medicineId] = {
                                checked: log.isTaken,
                                checkedAt: log.takenAt,
                            };
                        });
                        newState.checkedMeds = newCheckedMeds;
                    }

                    newState.lastSyncedAt = new Date().toISOString();
                    newState.syncStatus = 'success';

                    return newState;
                });
            },
        }),
        {
            name: 'med-check-alarm-v2', // localStorage key (v2로 버전업)
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                slots: state.slots,
                checkedMeds: state.checkedMeds,
                userId: state.userId,
                lastSyncedAt: state.lastSyncedAt,
                // fcmToken은 저장하지 않음 (보안상 이유)
            }),
        }
    )
);

// ===== Selector Hooks (성능 최적화) =====

/**
 * 특정 시간대의 알람 슬롯 선택
 */
export const useAlarmSlot = (slotId: TimeSlot) =>
    useAlarmStore((state) => state.slots.find((s) => s.id === slotId));

/**
 * 특정 약의 체크 상태 선택
 */
export const useMedChecked = (medId: string) =>
    useAlarmStore((state) => state.checkedMeds[medId]?.checked ?? false);

/**
 * 동기화 상태 선택
 */
export const useSyncStatus = () =>
    useAlarmStore((state) => ({
        status: state.syncStatus,
        lastSyncedAt: state.lastSyncedAt,
    }));
