/**
 * 복용 기록 저장 API
 * POST /api/medicines/log
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { medicineLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, medicineId, date, isTaken } = body;

        if (!userId || !medicineId || !date) {
            return NextResponse.json(
                { error: 'userId, medicineId, and date are required' },
                { status: 400 }
            );
        }

        if (!db) {
            return NextResponse.json(
                { error: 'Database not connected' },
                { status: 500 }
            );
        }

        // 기존 기록 확인
        const existingLogs = await db
            .select()
            .from(medicineLogs)
            .where(and(
                eq(medicineLogs.userId, userId),
                eq(medicineLogs.medicineId, medicineId),
                eq(medicineLogs.logDate, date)
            ));

        let result;

        if (existingLogs.length > 0) {
            // 기존 기록 업데이트
            [result] = await db
                .update(medicineLogs)
                .set({
                    isTaken,
                    takenAt: isTaken ? new Date() : null,
                    updatedAt: new Date(),
                })
                .where(eq(medicineLogs.id, existingLogs[0].id))
                .returning();
        } else {
            // 새 기록 생성
            [result] = await db
                .insert(medicineLogs)
                .values({
                    userId,
                    medicineId,
                    logDate: date,
                    isTaken,
                    takenAt: isTaken ? new Date() : null,
                })
                .returning();
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] POST /api/medicines/log error:', error);
        return NextResponse.json(
            { error: 'Failed to save medicine log' },
            { status: 500 }
        );
    }
}

/**
 * 특정 날짜의 복용 기록 조회
 * GET /api/medicines/log?userId=xxx&date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId');
    const date = request.nextUrl.searchParams.get('date');

    if (!userId || !date) {
        return NextResponse.json(
            { error: 'userId and date are required' },
            { status: 400 }
        );
    }

    if (!db) {
        return NextResponse.json(
            { error: 'Database not connected' },
            { status: 500 }
        );
    }

    try {
        const result = await db
            .select()
            .from(medicineLogs)
            .where(and(
                eq(medicineLogs.userId, userId),
                eq(medicineLogs.logDate, date)
            ));

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] GET /api/medicines/log error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch medicine logs' },
            { status: 500 }
        );
    }
}
