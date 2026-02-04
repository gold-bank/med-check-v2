# Migration Roadmap

> 기존 `med-check` v1에서 v2로의 마이그레이션 작업 순서

---

## Phase 1: Setup (환경 구축) ✅

- [x] 1.1 Next.js 16 프로젝트 생성
- [x] 1.2 `shadcn/ui` 설치 및 컴포넌트 세팅
- [x] 1.3 상태 관리 및 핵심 라이브러리 설정

---

## Phase 2: DB Setup & Data Migration ✅

- [x] 2.1 이미지/자산 복사 완료
- [x] 2.2 Supabase & Drizzle ORM 설정
- [x] 2.3 DB 스키마 정의 (`src/lib/db/schema.ts`)
- [x] 2.4 DB Push & Seed 완료

---

## Phase 3: 메인 대시보드 구축 ✅

- [x] 3.1 복용 로직 유틸 함수 (`src/lib/utils.ts`)
- [x] 3.2 API Routes 생성 (임시)
- [x] 3.3 메인 페이지 구현 (`src/app/page.tsx`)
- [x] 3.4 헤더 컴포넌트 (`src/components/features/Header.tsx`)
- [x] 3.5 빌드 검증 ✓

---

## Phase 4: 알람 시스템 & Server Actions ✅ ← NEW!

### 4.1 Server Actions 전환 ✅
- [x] `src/server/actions/medicine.ts` - 약 CRUD Server Actions
- [x] `src/server/actions/alarm.ts` - 알람 설정 Server Actions
- [x] `src/server/actions/notification.ts` - 알림 스케줄링 Server Actions
  - [x] `scheduleNotification()` - Upstash QStash 예약
  - [x] `cancelNotification()` - 예약 취소
  - [x] `toggleAlarmWithSchedule()` - 알람 토글 + DB 저장
  - [x] `updateAlarmTimeWithSchedule()` - 시간 변경 + 스케줄 재예약
- [x] 메인 페이지를 Server Actions로 전환

### 4.2 알람 설정 모달 ✅
- [x] `src/components/features/alarm/AlarmPicker.tsx` 구현
  - [x] shadcn/ui Dialog, Select, Switch 사용
  - [x] 시간 선택 UI (시/분 드롭다운)
  - [x] ON/OFF 토글
  - [x] 레트로 디지털 폰트 적용
  - [x] Store 연동

### 4.3 Upstash QStash 연동 ✅
- [x] KST 시간 기준 딜레이 계산
- [x] 알람 ON → Upstash 예약
- [x] 알람 OFF → Upstash 예약 취소
- [x] `scheduleId` DB 저장 (alarm_settings 테이블)

### 4.4 FCM / PWA 이식 ✅
- [x] `src/lib/firebase.ts` - Firebase 클라이언트 설정
- [x] `src/hooks/useFcmToken.ts` - FCM 토큰 관리 훅
- [x] `public/firebase-messaging-sw.js` - 서비스 워커
- [x] `src/app/api/send-notification/route.ts` - FCM 발송 API
- [x] 헤더에 알람 설정 버튼 추가

---

## Phase 5: Testing & Deployment (다음 단계)

- [ ] 5.1 전체 플로우 테스트
- [ ] 5.2 Vercel 배포
- [ ] 5.3 환경 변수 설정
- [ ] 5.4 최종 검증

---

## 📌 현재 단계

```
[■■■■■■■■□□] Phase 4 완료!
```

---

## 📝 완료된 작업 요약

### 생성/수정된 파일

| 파일 | 설명 |
|------|------|
| `src/server/actions/notification.ts` | Upstash QStash 알림 스케줄링 |
| `src/components/features/alarm/AlarmPicker.tsx` | 알람 설정 모달 (UI) |
| `src/hooks/useFcmToken.ts` | FCM 토큰 관리 훅 |
| `src/app/api/send-notification/route.ts` | FCM 푸시 발송 API |
| `public/firebase-messaging-sw.js` | Firebase 서비스 워커 |
| `src/components/features/Header.tsx` | 알람 버튼 추가 |
| `src/app/page.tsx` | Server Actions 연동 |
| `src/lib/db/seed.ts` | defaultTime 필드 추가 |

### 알람 플로우

```
[사용자] 헤더 🔔 클릭
    ↓
[AlarmPicker] 모달 열림 → 시간 설정 → ON/OFF 토글
    ↓
[toggleAlarmWithSchedule] Server Action 호출
    ↓
[Upstash QStash] 딜레이 계산 → 메시지 예약  
    ↓
[DB] scheduleId 저장 (취소용)
    ↓
(지정 시간 도달)
    ↓
[Upstash → /api/send-notification] Webhook 호출
    ↓
[Firebase Admin] FCM 푸시 발송
    ↓
[사용자] 💊 알림 수신!
```

### 사용 가능한 명령어
```bash
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드 ✅
npm run db:push      # 스키마를 DB에 반영
npm run db:studio    # Drizzle Studio
```
