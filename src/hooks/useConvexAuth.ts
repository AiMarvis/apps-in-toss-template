import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuth, onIdTokenChanged } from 'firebase/auth';
import { firebaseApp } from '../firebase';

/**
 * Firebase Auth ID Token을 Convex에 전달하는 인증 훅
 *
 * ConvexProviderWithAuth의 useAuth prop으로 사용됩니다.
 * Firebase Auth의 onIdTokenChanged를 감시하여
 * 토큰이 변경될 때마다 Convex에 자동으로 전달합니다.
 *
 * @see https://docs.convex.dev/auth/advanced/custom-auth
 */
export function useAuthFromFirebase() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const auth = useMemo(() => getAuth(firebaseApp), []);

    const fetchAccessToken = useCallback(
        async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
            const user = auth.currentUser;
            if (!user) return null;

            try {
                const token = await user.getIdToken(forceRefreshToken);
                return token;
            } catch (error) {
                console.error('[useAuthFromFirebase] ID Token 발급 실패:', error);
                return null;
            }
        },
        [auth]
    );

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    return useMemo(
        () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
        }),
        [isLoading, isAuthenticated, fetchAccessToken]
    );
}
