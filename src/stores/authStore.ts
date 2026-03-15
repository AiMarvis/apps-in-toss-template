import { create } from 'zustand';
import {
    onAuthStateChanged,
    signOut,
    type Auth,
    type Unsubscribe,
    type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import {
    checkTossIntegration,
    clearSessionForDisconnect,
    isTossUser,
    loginWithToss,
} from '../services/tossAuth';

// TODO: 앱 이름에 맞게 변경
const ONBOARDING_KEY = 'myapp_onboarding_seen';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    initialized: boolean;
    isOnboardingSeen: boolean;
    error: string | null;
    initialize: () => Promise<void>;
    login: () => Promise<boolean>;
    logout: () => Promise<void>;
    markOnboardingSeen: () => void;
    clearError: () => void;
}

let unsubscribeAuth: Unsubscribe | null = null;

/**
 * 연동 해제 감시 — onAuthStateChanged 콜백 내에서 호출
 * (3지점 재검증 중 2번째)
 */
async function guardDisconnect(currentAuth: Auth, currentUser: User | null): Promise<boolean> {
    if (!isTossUser(currentUser)) {
        return true;
    }

    const isLinked = await checkTossIntegration();

    // ⚠️ 엄격 비교: isLinked === false (!isLinked 금지)
    if (isLinked === false) {
        clearSessionForDisconnect();
        await signOut(currentAuth);
        return false;
    }

    return true;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    initialized: false,
    isOnboardingSeen: localStorage.getItem(ONBOARDING_KEY) === 'true',
    error: null,

    /**
     * Firebase Auth 초기화 + 연동 해제 감시 등록
     * (3지점 재검증 중 1번째: 앱 시작)
     */
    initialize: async () => {
        if (get().initialized) {
            return;
        }

        if (unsubscribeAuth) {
            unsubscribeAuth();
            unsubscribeAuth = null;
        }

        if (!isFirebaseConfigured) {
            set({ isLoading: false, initialized: true });
            return;
        }

        unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            const isAllowed = await guardDisconnect(auth, firebaseUser);
            set({
                user: isAllowed ? firebaseUser : null,
                isLoading: false,
                initialized: true,
            });
        });
    },

    /**
     * 토스 로그인 실행
     */
    login: async () => {
        if (!isFirebaseConfigured) {
            set({ error: 'Firebase 설정이 필요합니다.', isLoading: false });
            return false;
        }

        set({ isLoading: true, error: null });

        try {
            await loginWithToss(auth);
            set({ isLoading: false });
            return true;
        } catch (error) {
            const rawMessage = error instanceof Error ? error.message : '토스 로그인에 실패했습니다.';
            const userMessage = rawMessage.includes('Failed to exchange')
                ? '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                : rawMessage;
            console.error('[authStore] 로그인 실패:', rawMessage);
            set({
                isLoading: false,
                error: userMessage,
            });
            return false;
        }
    },

    /**
     * 로그아웃 + 세션 정리
     * 연동 해제 시 온보딩 플래그도 삭제 (재연동 = 신규 사용자)
     */
    logout: async () => {
        clearSessionForDisconnect();
        if (isFirebaseConfigured) {
            await signOut(auth);
        }

        localStorage.removeItem(ONBOARDING_KEY);
        set({ user: null, error: null, isOnboardingSeen: false });
    },

    markOnboardingSeen: () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        set({ isOnboardingSeen: true });
    },

    clearError: () => set({ error: null }),
}));
