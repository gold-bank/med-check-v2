/**
 * FCM 알림 발송 API
 * Upstash QStash에서 호출됨
 */

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase Admin 초기화
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log('[Firebase Admin] Initialized');
    } catch (error) {
        console.error('[Firebase Admin] Init failed:', error);
    }
}

export async function POST(request: NextRequest) {
    console.log('[API] /api/send-notification called');

    try {
        const body = await request.json();
        const { token, heading, content } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Missing FCM token' },
                { status: 400 }
            );
        }

        const message = {
            token: token,
            notification: {
                title: heading || '💊 복약 시간!',
                body: content || '약을 복용할 시간이에요.',
            },
            android: {
                notification: {
                    channelId: 'med_check_channel',
                },
            },
            webpush: {
                notification: {
                    icon: '/pill-icon.png',
                    badge: '/pill-icon.png',
                },
            },
        };

        console.log('[FCM] Sending notification...');
        const response = await admin.messaging().send(message);
        console.log('[FCM] Sent successfully:', response);

        return NextResponse.json({ success: true, messageId: response });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[FCM] Send failed:', errorMessage);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
