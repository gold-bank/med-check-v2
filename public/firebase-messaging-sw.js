// public/firebase-messaging-sw.js
// Firebase Cloud Messaging 서비스 워커

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBIXcgKCgoWy-nNS1-uGZaKRZirliPjVZg",
    authDomain: "med-check-app-c4ee9.firebaseapp.com",
    projectId: "med-check-app-c4ee9",
    storageBucket: "med-check-app-c4ee9.firebasestorage.app",
    messagingSenderId: "290380737299",
    appId: "1:290380737299:web:904b39389da696eb6a08e6",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 수신
// 서버에서 'notification' 필드를 포함하면 SDK가 자동으로 알림 표시
// 중복 방지를 위해 수동 표시 로직은 제거
/*
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
});
*/
