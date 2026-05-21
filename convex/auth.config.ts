export default {
    providers: [
        {
            // Firebase Auth JWT 검증
            domain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'placeholder.firebaseapp.com',
            applicationID: 'convex',
        },
    ],
};
