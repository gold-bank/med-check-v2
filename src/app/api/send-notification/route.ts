/**
 * FCM 알림 발송 API
 * Upstash QStash에서 호출됨
 */

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Helper to mask secrets for logging
const mask = (str: string | undefined) => str ? `${str.slice(0, 5)}...` : 'undefined';

function initFirebase() {
    if (!admin.apps.length) {
        console.log('[API] Environment Check:', {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY
        });

        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY is missing');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
            console.log('[Firebase Admin] Initialized successfully');
        } catch (error) {
            console.error('[Firebase Admin] Initialization failed:', error);
            // Re-throw so the API request fails explicitly if init fails
            throw error;
        }
    }
}

export async function POST(request: NextRequest) {
    console.log('[API] /api/send-notification called');

    try {
        // Init Firebase on every request to be safe (it checks apps.length inside)
        initFirebase();

        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('[API] Failed to parse JSON body', e);
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { token, heading, content } = body;

        console.log('[API] Payload:', { token: mask(token), heading, content });

        if (!token) {
            console.error('[API] Missing FCM token');
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

        console.log('[FCM] Sending message to Firebase...');
        const response = await admin.messaging().send(message);
        console.log('[FCM] Sent successfully, ID:', response);

        return NextResponse.json({ success: true, messageId: response });
    } catch (error: any) {
        console.error('[API] Critical Error:', error);

        // Detailed error for debugging (remove stack in real prod if sensitive, but good for now)
        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
                stack: error.stack,
                code: error.code || 'UNKNOWN_ERROR'
            },
            { status: 500 }
        );
    }
}
