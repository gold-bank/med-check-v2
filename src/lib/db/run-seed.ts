/**
 * 시드 스크립트 실행 파일
 * 터미널에서 npx tsx src/lib/db/run-seed.ts 실행
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { users, medicines, alarmSettings } from './schema';
import { SEED_MEDICINES, DEFAULT_ALARM_TIMES } from './seed';
import type { TimeSlot } from './schema';

async function runSeed() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL is not set. Check .env.local');
        process.exit(1);
    }

    console.log('🔗 Connecting to database...');
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    console.log('🌱 Starting seed process...');

    try {
        // 1. 기본 사용자 생성 (게스트 유저)
        console.log('📝 Creating default user...');

        // 기존 사용자 확인
        const existingUsers = await db.select().from(users).limit(1);

        let userId: string;

        if (existingUsers.length > 0) {
            console.log('ℹ️  Using existing user:', existingUsers[0].id);
            userId = existingUsers[0].id;
        } else {
            const [newUser] = await db
                .insert(users)
                .values({
                    email: 'guest@med-check.app',
                    displayName: 'Guest User',
                    timezone: 'Asia/Seoul',
                    notificationsEnabled: true,
                })
                .returning();

            console.log('✅ Created user:', newUser.id);
            userId = newUser.id;
        }

        // 약 데이터 시드
        await seedMedicines(db, userId);

        // 알람 설정 시드
        await seedAlarms(db, userId);

        console.log('🎉 Seed completed successfully!');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        await client.end();
        process.exit(1);
    }

    await client.end();
    process.exit(0);
}

async function seedMedicines(db: ReturnType<typeof drizzle>, userId: string) {
    console.log('💊 Seeding medicines...');

    // 기존 약 데이터 확인
    const existingMeds = await db.select().from(medicines).where(
        // @ts-ignore
        schema.medicines.userId.equals ? undefined : undefined
    ).limit(1);

    // 간단히 count로 체크
    const allMeds = await db.select().from(medicines);
    if (allMeds.length > 0) {
        console.log(`ℹ️  Medicines already exist (${allMeds.length}). Skipping...`);
        return;
    }

    const medicinesData = SEED_MEDICINES.map((med) => ({
        ...med,
        userId,
        isActive: true,
    }));

    const result = await db.insert(medicines).values(medicinesData).returning();
    console.log(`✅ Inserted ${result.length} medicines`);
}

async function seedAlarms(db: ReturnType<typeof drizzle>, userId: string) {
    console.log('⏰ Seeding alarm settings...');

    // 기존 알람 설정 확인
    const existingAlarms = await db.select().from(alarmSettings);
    if (existingAlarms.length > 0) {
        console.log(`ℹ️  Alarm settings already exist (${existingAlarms.length}). Skipping...`);
        return;
    }

    const slots = Object.keys(DEFAULT_ALARM_TIMES) as TimeSlot[];
    const alarmsData = slots.map((slot) => ({
        userId,
        slot,
        alarmTime: DEFAULT_ALARM_TIMES[slot],
        isEnabled: false,
    }));

    const result = await db.insert(alarmSettings).values(alarmsData).returning();
    console.log(`✅ Inserted ${result.length} alarm settings`);
}

// 실행
runSeed();
