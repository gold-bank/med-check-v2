/**
 * 약 관련 타입 정의
 * v1의 lib/medicines.ts에서 이식
 */

export type TimeSlot = 'dawn' | 'morning' | 'noon' | 'snack' | 'evening' | 'night';

export interface Medicine {
    id: string;
    name: string;
    dose: string;
    timeSlot: TimeSlot;

    // 선택적 속성
    dayOfWeek?: number[];      // 특정 요일에만 복용 (0=일, 1=월, ...)
    isActiveToday?: boolean;   // 오늘 복용일인지 (D3)
    isDanger?: boolean;        // 위험 약물 (MTX)
    badge?: string;            // D-Day 뱃지 (TODAY, D-1 등)
    dayBadge?: string;         // 요일 뱃지
    showFolicWarning?: boolean;// 엽산 경고
    notes?: string[];          // 주의사항
}

export interface TimeSlotConfig {
    id: TimeSlot;
    label: string;
    iconName: string;
    defaultTime: string;
}

export const TIME_SLOT_CONFIGS: TimeSlotConfig[] = [
    { id: 'dawn', label: '새벽', iconName: 'dawn', defaultTime: '05:00' },
    { id: 'morning', label: '아침', iconName: 'morning', defaultTime: '08:00' },
    { id: 'noon', label: '점심', iconName: 'sun', defaultTime: '12:00' },
    { id: 'snack', label: '간식', iconName: 'cookie', defaultTime: '15:00' },
    { id: 'evening', label: '저녁', iconName: 'moon', defaultTime: '18:00' },
    { id: 'night', label: '취침', iconName: 'wait', defaultTime: '22:00' },
];
