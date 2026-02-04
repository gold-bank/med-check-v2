/**
 * Drizzle ORM Database Client
 * Supabase PostgreSQL 연결
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 환경 변수에서 연결 문자열 가져오기
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('[DB] DATABASE_URL is not set. Database features will be disabled.');
}

// PostgreSQL 클라이언트 생성 (연결 풀링)
const client = connectionString
    ? postgres(connectionString, {
        max: 10, // 최대 연결 수
        idle_timeout: 20, // 유휴 연결 타임아웃 (초)
        connect_timeout: 10, // 연결 타임아웃 (초)
    })
    : null;

// Drizzle ORM 인스턴스
export const db = client
    ? drizzle(client, { schema })
    : null;

// 타입 export
export type DB = typeof db;

/**
 * DB 연결 상태 확인
 */
export function isDatabaseConnected(): boolean {
    return db !== null;
}

/**
 * DB 헬스 체크
 */
export async function checkDatabaseHealth(): Promise<boolean> {
    if (!db || !client) {
        return false;
    }

    try {
        await client`SELECT 1`;
        return true;
    } catch (error) {
        console.error('[DB] Health check failed:', error);
        return false;
    }
}
