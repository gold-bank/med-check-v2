/**
 * 초기 데이터 (Seed Data)
 * v1의 BASE_MEDICINES를 DB 형식으로 변환
 */

import type { NewMedicine, TimeSlot } from './schema';

/**
 * 시간대 정보 (UI 표시용)
 */
export const TIME_SLOTS_CONFIG = [
    {
        id: 'dawn' as TimeSlot,
        label: '기상 직후',
        icon: 'dawn',
        defaultTime: '05:00',
        notes: ['칼슘제와 4시간 이상 간격 필수', '1시간 금식'],
    },
    {
        id: 'morning' as TimeSlot,
        label: '아침 식사',
        icon: 'morning',
        defaultTime: '08:00',
        notes: ['소화효소: 식사 시작 직후', '**엽산은 화요일 아침 복용 X (저녁으로!)**'],
    },
    {
        id: 'noon' as TimeSlot,
        label: '점심 식사',
        icon: 'sun',
        defaultTime: '12:00',
        notes: ['골다공증 예방 최강 조합', '**비타민 D3는 3일에 1번만**'],
    },
    {
        id: 'snack' as TimeSlot,
        label: '오후 간식',
        icon: 'cookie',
        defaultTime: '15:00',
        notes: ['흡수율 극대화 (빈속 복용)'],
    },
    {
        id: 'evening' as TimeSlot,
        label: '저녁 식사',
        icon: 'moon',
        defaultTime: '18:00',
        notes: ['오메가-3 하루 총 2,500mg 완성'],
    },
    {
        id: 'night' as TimeSlot,
        label: '식후 30분',
        icon: 'wait',
        defaultTime: '22:00',
        notes: ['천연 신경안정제 (숙면 유도)', '씬지록신과 8시간 이상 간격'],
    },
] as const;

/**
 * 초기 약 데이터 (v1에서 이식)
 * userId는 실행 시 동적으로 설정
 */
export const SEED_MEDICINES: Omit<NewMedicine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
    // ===== 기상 직후 (dawn) =====
    {
        name: '씬지록신',
        dose: '(갑상선 약) + 물 많이',
        slot: 'dawn',
        displayOrder: 1,
        metadata: { notes: ['공복에 복용', '1시간 금식'] },
    },

    // ===== 아침 식사 (morning) =====
    {
        name: '소화효소',
        dose: '1알 (베이직)',
        slot: 'morning',
        displayOrder: 1,
    },
    {
        name: '류마티스 처방약',
        dose: '(소론도, 옥시, 조피린, 라피졸)',
        slot: 'morning',
        displayOrder: 2,
        encryptedName: null, // 추후 암호화 적용 가능
        metadata: { hospitalName: '류마티스내과' },
    },
    {
        name: '종근당 활성엽산',
        dose: '1알 (0.8mg)',
        slot: 'morning',
        displayOrder: 3,
        tuesdayEvening: true, // 화요일은 저녁으로 이동
    },
    {
        name: '브라질너트',
        dose: '2알',
        slot: 'morning',
        displayOrder: 4,
    },

    // ===== 점심 식사 (noon) =====
    {
        name: '소화효소',
        dose: '1알 (베이직)',
        slot: 'noon',
        displayOrder: 1,
    },
    {
        name: '구연산 칼슘',
        dose: '1알 (250mg)',
        slot: 'noon',
        displayOrder: 2,
    },
    {
        name: '마그네슘',
        dose: '1알 (100mg)',
        slot: 'noon',
        displayOrder: 3,
    },
    {
        name: '오메가-3',
        dose: '1알 (1250mg)',
        slot: 'noon',
        displayOrder: 4,
    },
    {
        name: '비타민 K2',
        dose: '1알',
        slot: 'noon',
        displayOrder: 5,
    },
    {
        name: '비타민 D3',
        dose: '(4000 IU)',
        slot: 'noon',
        displayOrder: 6,
        cycleType: 'D3',
        cycleStart: '2026-01-28',
        cyclePeriod: 3,
    },

    // ===== 오후 간식 (snack) =====
    {
        name: '구연산 칼슘',
        dose: '1알 (250mg)',
        slot: 'snack',
        displayOrder: 1,
    },
    {
        name: '마그네슘',
        dose: '1알 (100mg)',
        slot: 'snack',
        displayOrder: 2,
    },

    // ===== 저녁 식사 (evening) =====
    {
        name: '소화효소',
        dose: '1알 (베이직)',
        slot: 'evening',
        displayOrder: 1,
    },
    {
        name: '류마티스 처방약',
        dose: '(저녁분)',
        slot: 'evening',
        displayOrder: 2,
        metadata: { hospitalName: '류마티스내과' },
    },
    {
        name: '오메가-3',
        dose: '1알 (1250mg)',
        slot: 'evening',
        displayOrder: 3,
    },
    {
        name: 'MTX (6알)',
        dose: '',
        slot: 'evening',
        displayOrder: 4,
        cycleType: 'MTX',
        targetDayOfWeek: 1, // 월요일
        metadata: { notes: ['월요일만 복용', '면역억제제'] },
    },

    // ===== 취침 전 (night) =====
    {
        name: '구연산 칼슘',
        dose: '1알 (250mg)',
        slot: 'night',
        displayOrder: 1,
    },
    {
        name: '마그네슘',
        dose: '1알 (100mg)',
        slot: 'night',
        displayOrder: 2,
    },
];

/**
 * 기본 알람 시간 설정
 */
export const DEFAULT_ALARM_TIMES = {
    dawn: '05:00',
    morning: '08:00',
    noon: '12:00',
    snack: '15:00',
    evening: '18:00',
    night: '22:00',
} as const;
