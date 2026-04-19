'use client';

import { useEffect } from 'react';

/**
 * 서비스 워커 자동 등록 + 업데이트 감지
 * - 새 버전이 배포되면 PWA가 자동으로 최신 버전으로 교체됩니다.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // 새 서비스 워커가 대기 중이면 즉시 활성화
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              // 새 SW가 활성화됐고 이미 기존 SW가 있었다면 → 페이지 새로고침
              if (
                newWorker.state === 'activated' &&
                navigator.serviceWorker.controller
              ) {
                window.location.reload();
              }
            });
          });
        })
        .catch((err) => {
          console.error('[SW] 등록 실패:', err);
        });

      // 다른 탭에서 SW 업데이트가 발생한 경우에도 새로고침
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  return null;
}
