// sw.js — Med-Check 업데이트 자동화 서비스 워커
// 새 버전이 배포되면 즉시 활성화하고 모든 클라이언트를 새로고침합니다.

const CACHE_NAME = 'med-check-shell-v1';

// ① 설치 즉시 대기 없이 활성화
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ② 활성화 즉시 모든 탭/창 제어권 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 이전 캐시 삭제
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // 열려 있는 모든 PWA 창 즉시 제어
      await clients.claim();
    })()
  );
});

// ③ 네비게이션(페이지 이동)은 항상 네트워크 우선
//    → 새 배포가 되면 항상 최신 HTML/JS를 받아옴
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // HTML 페이지 요청은 항상 네트워크에서 가져옴
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Next.js 청크(_next/static)는 캐시 우선 (파일명에 해시 포함돼 자동 무효화)
  if (request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }
});
