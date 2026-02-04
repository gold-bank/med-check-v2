/**
 * Drizzle ORM Schema for Med-Check Pro
 * 
 * 테이블 구조:
 * 1. users - 사용자 정보 (인증 연동)
 * 2. medicines - 약 정보 (이름, 용량, 시간대, 주기 규칙)
 * 3. medicine_logs - 복용 기록 (체크 여부, 복용 시각)
 * 4. alarm_settings - 알람 설정 (시간대별 알람)
 */

import {
    pgTable,
    uuid,
    text,
    varchar,
    integer,
    boolean,
    timestamp,
    date,
    jsonb,
    pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== ENUMS =====

/** 시간대 enum */
export const timeSlotEnum = pgEnum('time_slot', [
    'dawn',      // 기상 직후
    'morning',   // 아침 식사
    'noon',      // 점심 식사
    'snack',     // 오후 간식
    'evening',   // 저녁 식사
    'night',     // 취침 전
]);

/** 사이클 약물 타입 */
export const cycleTypeEnum = pgEnum('cycle_type', [
    'D3',   // 비타민 D3 (3일 주기)
    'MTX',  // 메토트렉세이트 (특정 요일)
    'WEEKLY', // 주간 복용약
]);

// ===== TABLES =====

/**
 * 사용자 테이블
 * - Supabase Auth와 연동
 * - 추후 FCM 토큰, 설정 등 저장
 */
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Supabase Auth 연동
    authId: varchar('auth_id', { length: 255 }).unique(),

    // 기본 정보
    email: varchar('email', { length: 255 }),
    displayName: varchar('display_name', { length: 100 }),

    // FCM 토큰 (푸시 알림용)
    fcmToken: text('fcm_token'),

    // 설정
    timezone: varchar('timezone', { length: 50 }).default('Asia/Seoul'),
    notificationsEnabled: boolean('notifications_enabled').default(true),

    // 메타데이터
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 약 정보 테이블
 * - 이름은 암호화 고려 (encryptedName 필드)
 * - 주기 규칙 지원 (D3: 3일 주기, MTX: 특정 요일)
 */
export const medicines = pgTable('medicines', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

    // 기본 정보
    name: varchar('name', { length: 200 }).notNull(),
    // 암호화된 이름 (민감 정보용 - 병원명, 처방전 정보 등)
    encryptedName: text('encrypted_name'),

    dose: varchar('dose', { length: 100 }),
    slot: timeSlotEnum('slot').notNull(),

    // 표시 순서
    displayOrder: integer('display_order').default(0),

    // 주기 규칙
    cycleType: cycleTypeEnum('cycle_type'),
    cycleStart: date('cycle_start'),           // D3: 시작일
    cyclePeriod: integer('cycle_period'),       // D3: 주기 (일)
    targetDayOfWeek: integer('target_day_of_week'), // MTX: 요일 (0=일, 1=월, ...)

    // 화요일 규칙 (엽산 등)
    tuesdayEvening: boolean('tuesday_evening').default(false),

    // 추가 메타데이터 (유연한 확장용)
    metadata: jsonb('metadata').$type<{
        notes?: string[];
        hospitalName?: string;
        prescriptionDate?: string;
        expiryDate?: string;
    }>(),

    // 상태
    isActive: boolean('is_active').default(true),

    // 타임스탬프
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 복용 기록 테이블
 * - 날짜별 약 체크 기록
 * - 실제 복용 시간 기록
 */
export const medicineLogs = pgTable('medicine_logs', {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    medicineId: uuid('medicine_id').references(() => medicines.id, { onDelete: 'cascade' }),

    // 날짜 (어느 날짜의 기록인지)
    logDate: date('log_date').notNull(),

    // 체크 여부
    isTaken: boolean('is_taken').default(false),

    // 실제 복용 시간 (체크한 시간)
    takenAt: timestamp('taken_at'),

    // 스킵 사유 (복용하지 않은 경우)
    skipReason: varchar('skip_reason', { length: 255 }),

    // 메모
    notes: text('notes'),

    // 타임스탬프
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 알람 설정 테이블
 * - 시간대별 알람 시간 및 활성화 여부
 */
export const alarmSettings = pgTable('alarm_settings', {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

    slot: timeSlotEnum('slot').notNull(),

    // 알람 시간 (HH:MM 형식)
    alarmTime: varchar('alarm_time', { length: 5 }).notNull(),

    // 활성화 여부
    isEnabled: boolean('is_enabled').default(false),

    // Upstash 스케줄 ID (취소용)
    scheduleId: varchar('schedule_id', { length: 255 }),

    // 타임스탬프
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===== RELATIONS =====

export const usersRelations = relations(users, ({ many }) => ({
    medicines: many(medicines),
    medicineLogs: many(medicineLogs),
    alarmSettings: many(alarmSettings),
}));

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
    user: one(users, {
        fields: [medicines.userId],
        references: [users.id],
    }),
    logs: many(medicineLogs),
}));

export const medicineLogsRelations = relations(medicineLogs, ({ one }) => ({
    user: one(users, {
        fields: [medicineLogs.userId],
        references: [users.id],
    }),
    medicine: one(medicines, {
        fields: [medicineLogs.medicineId],
        references: [medicines.id],
    }),
}));

export const alarmSettingsRelations = relations(alarmSettings, ({ one }) => ({
    user: one(users, {
        fields: [alarmSettings.userId],
        references: [users.id],
    }),
}));

// ===== TYPE EXPORTS =====

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Medicine = typeof medicines.$inferSelect;
export type NewMedicine = typeof medicines.$inferInsert;

export type MedicineLog = typeof medicineLogs.$inferSelect;
export type NewMedicineLog = typeof medicineLogs.$inferInsert;

export type AlarmSetting = typeof alarmSettings.$inferSelect;
export type NewAlarmSetting = typeof alarmSettings.$inferInsert;

export type TimeSlot = 'dawn' | 'morning' | 'noon' | 'snack' | 'evening' | 'night';
export type CycleType = 'D3' | 'MTX' | 'WEEKLY';
