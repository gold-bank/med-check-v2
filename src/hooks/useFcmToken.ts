'use client';

/**
 * FCM 토큰 관리 훅
 * - 알림 권한 요청
 * - FCM 토큰 발급 및 관리
 * - 포그라운드 메시지 수신
 */

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { getFirebaseApp } from '@/lib/firebase';

interface UseFcmTokenReturn {
    fcmToken: string | null;
    permission: NotificationPermission | 'unsupported';
    isLoading: boolean;
    error: string | null;
    requestPermission: () => Promise<string | null>;
}

export function useFcmToken(): UseFcmTokenReturn {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const requestPermission = useCallback(async (): Promise<string | null> => {
        // 브라우저 환경 체크
        if (typeof window === 'undefined') {
            setPermission('unsupported');
            setIsLoading(false);
            return null;
        }

        if (!('Notification' in window)) {
            setPermission('unsupported');
            setError('이 브라우저는 알림을 지원하지 않습니다.');
            setIsLoading(false);
            return null;
        }

        if (!('serviceWorker' in navigator)) {
            setPermission('unsupported');
            setError('서비스 워커를 지원하지 않습니다.');
            setIsLoading(false);
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            // 권한 요청
            const notificationPermission = await Notification.requestPermission();
            setPermission(notificationPermission);

            if (notificationPermission !== 'granted') {
                setError('알림 권한이 거부되었습니다.');
                setIsLoading(false);
                return null;
            }

            // Firebase Messaging 초기화
            const messaging = getMessaging(getFirebaseApp());

            // 서비스 워커 등록
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('[FCM] Service Worker registered:', registration.scope);

            // FCM 토큰 발급
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            if (token) {
                console.log('[FCM] Token:', token.substring(0, 20) + '...');
                setFcmToken(token);

                // 포그라운드 메시지 리스너 등록
                setupForegroundListener(messaging);

                setIsLoading(false);
                return token;
            } else {
                setError('FCM 토큰을 발급받지 못했습니다.');
                setIsLoading(false);
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'FCM 초기화 실패';
            console.error('[FCM] Error:', errorMessage);
            setError(errorMessage);
            setIsLoading(false);
            return null;
        }
    }, []);

    // 포그라운드 메시지 리스너
    const setupForegroundListener = (messaging: Messaging) => {
        onMessage(messaging, (payload) => {
            console.log('[FCM] Foreground message:', payload);

            // 포그라운드에서 수신 시 토스트로 표시
            if (payload.notification) {
                const { title, body } = payload.notification;
                // 브라우저 알림 표시
                if (Notification.permission === 'granted') {
                    new Notification(title || '알림', {
                        body: body || '',
                        icon: '/pill-icon.png',
                    });
                }
            }
        });
    };

    // 초기 로드 시 토큰 확인
    useEffect(() => {
        const initToken = async () => {
            // 이미 권한이 있으면 토큰 발급 시도
            if (typeof window !== 'undefined' && 'Notification' in window) {
                setPermission(Notification.permission);

                if (Notification.permission === 'granted') {
                    await requestPermission();
                } else {
                    setIsLoading(false);
                }
            } else {
                setPermission('unsupported');
                setIsLoading(false);
            }
        };

        initToken();
    }, [requestPermission]);

    return {
        fcmToken,
        permission,
        isLoading,
        error,
        requestPermission,
    };
}
