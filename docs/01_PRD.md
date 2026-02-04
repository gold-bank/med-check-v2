# Project: Med-Check Pro (v2 Migration)

## 🎯 목표

기존 `med-check` (v1)에서 검증된 **알림 로직(FCM+Upstash)**과 **UI 컨셉**을 유지하면서, **Next.js 16 + Server Actions + Tailwind v4 + Zustand** 기반으로 리팩토링한다.

---

## 📋 핵심 요구사항

### 1. 기능 유지 (Must Keep)
- ✅ FCM 푸시 알림 (토큰 발급 → Upstash 스케줄링 → 알림 전송)
- ✅ 시간대별 약 복용 체크리스트
- ✅ 알람 시간 설정 및 토글
- ✅ localStorage 기반 상태 저장
- ✅ PWA 지원 (홈화면 추가, 오프라인)

### 2. 기술 업그레이드 (Must Upgrade)
| 항목 | v1 (기존) | v2 (목표) |
|------|-----------|-----------|
| Framework | Next.js 14 | **Next.js 16** |
| API Routes | `api/route.ts` | **Server Actions** |
| Styling | Tailwind v3 | **Tailwind v4** |
| State | useState / useEffect | **Zustand** |
| Components | Custom | **shadcn/ui** |

### 3. 개선 사항 (Nice to Have)
- 🔄 React 19 Compiler 최적화
- 🎨 더 세련된 UI/UX
- 📱 향상된 모바일 터치 반응성

---

## 🏗️ 기술 스택

```
Frontend:
├── Next.js 16.1.6 (App Router)
├── React 19.2.3 (React Compiler)
├── TypeScript 5.x
├── Tailwind CSS 4.x
├── shadcn/ui (Components)
└── Zustand (State Management)

Backend:
├── Server Actions (Next.js 16)
├── Upstash QStash (Scheduling)
└── Firebase Cloud Messaging (Push)

Infrastructure:
├── Vercel (Deployment)
└── PWA (Service Worker)
```

---

## 📂 프로젝트 구조 (예정)

```
med-check-v2/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── actions/           # 🆕 Server Actions
│   │   └── notification.ts
│   ├── components/
│   │   ├── ui/            # shadcn/ui
│   │   ├── TimeCard.tsx
│   │   └── AlarmPicker.tsx
│   ├── stores/            # 🆕 Zustand
│   │   └── useAlarmStore.ts
│   └── lib/
│       ├── firebase.ts
│       └── utils.ts
├── public/
│   ├── icons/
│   └── manifest.json
└── docs/
    ├── 01_PRD.md
    ├── 02_TASK_LIST.md
    └── 03_CURSOR_RULES.md
```

---

## 🔗 참조
- 기존 프로젝트: `C:\Users\gdaum\Desktop\med-check`
- Next.js 16 Docs: https://nextjs.org/docs
- Tailwind v4 Docs: https://tailwindcss.com/docs
