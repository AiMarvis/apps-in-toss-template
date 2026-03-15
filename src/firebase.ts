import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export const firebaseApp = initializeApp({
    apiKey: firebaseConfig.apiKey ?? 'placeholder-api-key',
    authDomain: firebaseConfig.authDomain ?? 'placeholder.firebaseapp.com',
    projectId: firebaseConfig.projectId ?? 'placeholder-project',
    storageBucket: firebaseConfig.storageBucket ?? 'placeholder.appspot.com',
    messagingSenderId: firebaseConfig.messagingSenderId ?? '000000000000',
    appId: firebaseConfig.appId ?? '1:000000000000:web:placeholder',
});

export const auth = getAuth(firebaseApp);
