# Migration Rules

> 마이그레이션 작업 시 반드시 준수해야 할 규칙들

---

## 🔴 절대 규칙

### 1. Reuse Logic (로직 재사용)
```
FCM 토큰 발급, Upstash 시간 계산 등 v1에서 검증된 로직을 우선 사용한다.
- 동작하는 코드를 처음부터 다시 작성하지 않는다.
- 기존 로직을 복사 → 이해 → 필요시 수정 순서로 진행한다.
```

### 2. Upgrade Tech (기술 업그레이드)
```
로직은 가져오되, 구현 방식은 최신 기술을 사용한다.
- API Routes → Server Actions
- useState → Zustand
- 커스텀 컴포넌트 → shadcn/ui
```

### 3. Test Before Deploy (배포 전 테스트)
```
기능 변경 시 반드시 기존 동작과 비교 테스트한다.
- 알림이 정상적으로 예약/전송되는가?
- 상태가 정상적으로 저장/복원되는가?
```

---

## 🟡 코딩 컨벤션

### 파일 구조
```typescript
// 파일 상단 순서
1. 'use client' 또는 'use server' (필요시)
2. import - 외부 라이브러리
3. import - 내부 모듈 (@/ alias 사용)
4. 타입 정의
5. 상수/유틸리티
6. 컴포넌트 또는 함수
```

### 네이밍 규칙
```typescript
// 파일명
- 컴포넌트: PascalCase.tsx (예: TimeCard.tsx)
- 훅/유틸: camelCase.ts (예: useAlarmStore.ts)
- 액션: camelCase.ts (예: notification.ts)

// 변수/함수
- 상수: UPPER_SNAKE_CASE
- 변수/함수: camelCase
- 컴포넌트: PascalCase
- 타입/인터페이스: PascalCase
```

### Server Actions
```typescript
// actions/notification.ts
'use server'

export async function scheduleNotification(data: NotificationData) {
  // Upstash 스케줄링 로직
}

export async function cancelNotification(id: string) {
  // 스케줄 취소 로직
}
```

### Zustand Store
```typescript
// stores/useAlarmStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AlarmState {
  alarms: Alarm[]
  setAlarm: (alarm: Alarm) => void
  // ...
}

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set) => ({
      // state & actions
    }),
    { name: 'alarm-storage' }
  )
)
```

---

## 🟢 참조 매핑

### v1 → v2 파일 매핑
```
v1 (기존)                          → v2 (새로운)
─────────────────────────────────────────────────────────
src/app/api/schedule-notification/ → src/actions/notification.ts
src/components/TimeCard.tsx        → src/components/TimeCard.tsx (리디자인)
src/components/AlarmPicker.tsx     → src/components/AlarmPicker.tsx (리디자인)
src/app/page.tsx                   → src/app/page.tsx
lib/firebase.ts                    → src/lib/firebase.ts
```

### 주요 로직 위치 (v1 기준)
```
- FCM 토큰 발급: src/hooks/useFcmToken.ts
- Upstash 스케줄링: src/app/api/schedule-notification/route.ts
- 알람 시간 계산: 같은 route.ts 내 calculateTriggerTime 함수
- LocalStorage 키: 'alarmSlots', 'checkedMeds' 등
```

---

## ⚠️ 주의사항

1. **환경 변수 노출 금지**
   - Firebase/Upstash 키는 절대 클라이언트에 노출하지 않는다.
   - Server Actions 내에서만 사용한다.

2. **기존 사용자 데이터 호환**
   - localStorage 키와 구조를 가능한 유지한다.
   - 변경 시 마이그레이션 로직을 추가한다.

3. **iOS Safari/PWA 호환**
   - 터치 이벤트 처리 주의 (기존 버그 수정 사항 참고)
   - 서비스 워커 경로 확인

---

## 📌 참고 자료

- [Next.js 16 Docs - Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
