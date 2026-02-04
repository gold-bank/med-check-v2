/**
 * Firebase 클라이언트 설정
 * v1에서 이식
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

/**
 * Firebase 앱 초기화
 */
export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        const apps = getApps();
        app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    }
    return app;
}

/**
 * FCM Messaging 인스턴스 가져오기
 * 브라우저 환경에서만 동작
 */
export function getFirebaseMessaging(): Messaging | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!messaging) {
        const firebaseApp = getFirebaseApp();
        messaging = getMessaging(firebaseApp);
    }
    return messaging;
}

/**
 * FCM 토큰 발급
 */
export async function getFCMToken(): Promise<string | null> {
    try {
        const messagingInstance = getFirebaseMessaging();
        if (!messagingInstance) {
            console.warn('[Firebase] Messaging not available (SSR or unsupported browser)');
            return null;
        }

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('[Firebase] VAPID key not configured');
            return null;
        }

        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('[Firebase] Notification permission denied');
            return null;
        }

        // 서비스 워커 등록
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // FCM 토큰 발급
        const token = await getToken(messagingInstance, {
            vapidKey,
            serviceWorkerRegistration: registration,
        });

        console.log('[Firebase] FCM Token:', token);
        return token;
    } catch (error) {
        console.error('[Firebase] Error getting FCM token:', error);
        return null;
    }
}
