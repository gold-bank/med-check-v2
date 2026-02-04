import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, isMonday, isTuesday, parseISO, startOfDay } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===== 날짜 유틸 =====

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 요일 반환 (0: 일요일, 1: 월요일, ..., 6: 토요일)
 */
export function getDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

// ===== 복용 로직 =====

/**
 * D3 (비타민 D3) 복용일 계산
 * 3일에 1번 복용 (예: 1/28 복용 → 1/31 복용 → 2/3 복용)
 * 
 * @param cycleStart - 시작일 (YYYY-MM-DD)
 * @param cyclePeriod - 주기 (기본 3일)
 * @param targetDate - 확인할 날짜 (기본 오늘)
 * @returns 오늘이 복용일인지 여부
 */
export function isD3ActiveToday(
  cycleStart: string,
  cyclePeriod: number = 3,
  targetDate: Date = new Date()
): boolean {
  try {
    const startDate = startOfDay(parseISO(cycleStart));
    const today = startOfDay(targetDate);

    const daysDiff = differenceInDays(today, startDate);

    // 시작일 이전이면 false
    if (daysDiff < 0) return false;

    // 주기로 나눈 나머지가 0이면 복용일
    return daysDiff % cyclePeriod === 0;
  } catch {
    return false;
  }
}

/**
 * MTX 복용일 계산 (특정 요일만 복용)
 * 
 * @param targetDayOfWeek - 목표 요일 (0: 일요일, 1: 월요일, ...)
 * @param targetDate - 확인할 날짜 (기본 오늘)
 * @returns 오늘이 복용일인지 여부
 */
export function isMTXActiveToday(
  targetDayOfWeek: number = 1, // 기본 월요일
  targetDate: Date = new Date()
): boolean {
  return targetDate.getDay() === targetDayOfWeek;
}

/**
 * 오늘이 월요일인지 확인
 */
export function isTodayMonday(date: Date = new Date()): boolean {
  return isMonday(date);
}

/**
 * 오늘이 화요일인지 확인 (엽산 저녁 이동용)
 */
export function isTodayTuesday(date: Date = new Date()): boolean {
  return isTuesday(date);
}

/**
 * D-Day 계산 (비타민 D3 다음 복용일까지)
 * 
 * @param cycleStart - 시작일 (YYYY-MM-DD)
 * @param cyclePeriod - 주기 (기본 3일)
 * @param targetDate - 기준 날짜 (기본 오늘)
 * @returns D-Day 숫자 (0이면 오늘, 1이면 내일, ...)
 */
export function getD3DDay(
  cycleStart: string,
  cyclePeriod: number = 3,
  targetDate: Date = new Date()
): number {
  try {
    const startDate = startOfDay(parseISO(cycleStart));
    const today = startOfDay(targetDate);

    const daysDiff = differenceInDays(today, startDate);

    if (daysDiff < 0) {
      // 시작일 이전이면 시작일까지의 일수
      return Math.abs(daysDiff);
    }

    const remainder = daysDiff % cyclePeriod;

    if (remainder === 0) {
      return 0; // 오늘이 복용일
    }

    return cyclePeriod - remainder;
  } catch {
    return -1;
  }
}

/**
 * 약이 오늘 활성화되는지 계산
 * cycleType, targetDayOfWeek, tuesdayEvening 등을 고려
 */
export function isMedicineActiveToday(
  medicine: {
    cycleType?: 'D3' | 'MTX' | 'WEEKLY' | null;
    cycleStart?: string | null;
    cyclePeriod?: number | null;
    targetDayOfWeek?: number | null;
    tuesdayEvening?: boolean | null;
    slot: string;
  },
  targetDate: Date = new Date()
): { isActive: boolean; slot: string; dDay?: number } {
  const { cycleType, cycleStart, cyclePeriod, targetDayOfWeek, tuesdayEvening, slot } = medicine;

  // 화요일 엽산 이동 규칙
  if (tuesdayEvening && isTodayTuesday(targetDate)) {
    // 화요일이면:
    // - 아침 슬롯은 비활성화
    // - 저녁 슬롯으로 이동 (저녁에서 활성화)
    if (slot === 'morning') {
      return { isActive: false, slot: 'morning' };
    }
    if (slot === 'evening') {
      return { isActive: true, slot: 'evening' };
    }
  }

  // D3 주기 약
  if (cycleType === 'D3' && cycleStart && cyclePeriod) {
    const isActive = isD3ActiveToday(cycleStart, cyclePeriod, targetDate);
    const dDay = getD3DDay(cycleStart, cyclePeriod, targetDate);
    return { isActive, slot, dDay };
  }

  // MTX 특정 요일 약
  if (cycleType === 'MTX' && targetDayOfWeek !== null && targetDayOfWeek !== undefined) {
    const isActive = isMTXActiveToday(targetDayOfWeek, targetDate);
    return { isActive, slot };
  }

  // 기본적으로 활성화
  return { isActive: true, slot };
}
