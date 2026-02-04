import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
    // 스키마 파일 경로
    schema: './src/lib/db/schema.ts',

    // 마이그레이션 출력 경로
    out: './drizzle',

    // 데이터베이스 드라이버
    dialect: 'postgresql',

    // 데이터베이스 연결 정보
    dbCredentials: {
        url: process.env.DATABASE_URL || '',
    },

    // 상세 로그
    verbose: true,

    // 엄격 모드
    strict: true,
});
