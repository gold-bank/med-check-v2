'use server';

/**
 * 약 관리 Server Actions
 * 
 * CRUD 작업:
 * - getMedicinesBySlot: 시간대별 약 조회
 * - getMedicinesForUser: 사용자의 모든 약 조회
 * - createMedicine: 약 추가
 * - updateMedicine: 약 수정
 * - deleteMedicine: 약 삭제
 * - getMedicineLogsForDate: 특정 날짜의 복용 기록 조회
 * - toggleMedicineLog: 복용 체크/해제
 */

import { db } from '@/lib/db';
import { medicines, medicineLogs, type Medicine, type NewMedicine, type MedicineLog, type TimeSlot } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// ===== 약 조회 =====

/**
 * 사용자의 모든 약 조회
 */
export async function getMedicinesForUser(userId: string): Promise<Medicine[]> {
    if (!db) {
        console.warn('[Action] Database not connected, returning empty array');
        return [];
    }

    try {
        const result = await db
            .select()
            .from(medicines)
            .where(and(eq(medicines.userId, userId), eq(medicines.isActive, true)))
            .orderBy(medicines.slot, medicines.displayOrder);

        return result;
    } catch (error) {
        console.error('[Action] getMedicinesForUser error:', error);
        throw new Error('약 목록을 불러오는데 실패했습니다.');
    }
}

/**
 * 시간대별 약 조회
 */
export async function getMedicinesBySlot(userId: string, slot: TimeSlot): Promise<Medicine[]> {
    if (!db) {
        return [];
    }

    try {
        const result = await db
            .select()
            .from(medicines)
            .where(and(
                eq(medicines.userId, userId),
                eq(medicines.slot, slot),
                eq(medicines.isActive, true)
            ))
            .orderBy(medicines.displayOrder);

        return result;
    } catch (error) {
        console.error('[Action] getMedicinesBySlot error:', error);
        throw new Error('약 목록을 불러오는데 실패했습니다.');
    }
}

// ===== 약 등록/수정/삭제 =====

/**
 * 새 약 등록
 */
export async function createMedicine(data: NewMedicine): Promise<Medicine> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        const [result] = await db.insert(medicines).values(data).returning();
        return result;
    } catch (error) {
        console.error('[Action] createMedicine error:', error);
        throw new Error('약 등록에 실패했습니다.');
    }
}

/**
 * 약 정보 수정
 */
export async function updateMedicine(
    medicineId: string,
    data: Partial<Omit<NewMedicine, 'id' | 'userId' | 'createdAt'>>
): Promise<Medicine> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        const [result] = await db
            .update(medicines)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(medicines.id, medicineId))
            .returning();

        return result;
    } catch (error) {
        console.error('[Action] updateMedicine error:', error);
        throw new Error('약 수정에 실패했습니다.');
    }
}

/**
 * 약 삭제 (소프트 삭제)
 */
export async function deleteMedicine(medicineId: string): Promise<void> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        await db
            .update(medicines)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(medicines.id, medicineId));
    } catch (error) {
        console.error('[Action] deleteMedicine error:', error);
        throw new Error('약 삭제에 실패했습니다.');
    }
}

// ===== 복용 기록 =====

/**
 * 특정 날짜의 모든 복용 기록 조회
 */
export async function getMedicineLogsForDate(
    userId: string,
    date: string // YYYY-MM-DD 형식
): Promise<MedicineLog[]> {
    if (!db) {
        return [];
    }

    try {
        const result = await db
            .select()
            .from(medicineLogs)
            .where(and(
                eq(medicineLogs.userId, userId),
                eq(medicineLogs.logDate, date)
            ));

        return result;
    } catch (error) {
        console.error('[Action] getMedicineLogsForDate error:', error);
        throw new Error('복용 기록을 불러오는데 실패했습니다.');
    }
}

/**
 * 복용 체크 토글
 */
export async function toggleMedicineLog(
    userId: string,
    medicineId: string,
    date: string, // YYYY-MM-DD 형식
    isTaken: boolean
): Promise<MedicineLog> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        // 기존 기록 확인
        const existingLogs = await db
            .select()
            .from(medicineLogs)
            .where(and(
                eq(medicineLogs.userId, userId),
                eq(medicineLogs.medicineId, medicineId),
                eq(medicineLogs.logDate, date)
            ));

        if (existingLogs.length > 0) {
            // 기존 기록 업데이트
            const [result] = await db
                .update(medicineLogs)
                .set({
                    isTaken,
                    takenAt: isTaken ? new Date() : null,
                    updatedAt: new Date(),
                })
                .where(eq(medicineLogs.id, existingLogs[0].id))
                .returning();

            return result;
        } else {
            // 새 기록 생성
            const [result] = await db
                .insert(medicineLogs)
                .values({
                    userId,
                    medicineId,
                    logDate: date,
                    isTaken,
                    takenAt: isTaken ? new Date() : null,
                })
                .returning();

            return result;
        }
    } catch (error) {
        console.error('[Action] toggleMedicineLog error:', error);
        throw new Error('복용 기록 저장에 실패했습니다.');
    }
}

/**
 * 특정 시간대의 모든 약을 한번에 체크/해제
 */
export async function toggleSlotMedicines(
    userId: string,
    slot: TimeSlot,
    date: string,
    isTaken: boolean
): Promise<void> {
    if (!db) {
        throw new Error('Database not connected');
    }

    try {
        // 해당 시간대의 모든 약 조회
        const slotMedicines = await getMedicinesBySlot(userId, slot);

        // 각 약에 대해 복용 기록 토글
        await Promise.all(
            slotMedicines.map((med) => toggleMedicineLog(userId, med.id, date, isTaken))
        );
    } catch (error) {
        console.error('[Action] toggleSlotMedicines error:', error);
        throw new Error('복용 기록 일괄 저장에 실패했습니다.');
    }
}
