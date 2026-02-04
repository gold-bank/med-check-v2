/**
 * 약 목록 조회 API
 * GET /api/medicines?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { medicines } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json(
            { error: 'userId is required' },
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
            .from(medicines)
            .where(and(eq(medicines.userId, userId), eq(medicines.isActive, true)))
            .orderBy(medicines.slot, medicines.displayOrder);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] GET /api/medicines error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch medicines' },
            { status: 500 }
        );
    }
}
