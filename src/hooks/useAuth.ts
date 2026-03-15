import { useAuthStore } from '../stores/authStore';

export function useAuth() {
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);
    const initialized = useAuthStore((state) => state.initialized);
    const isOnboardingSeen = useAuthStore((state) => state.isOnboardingSeen);
    const error = useAuthStore((state) => state.error);
    const initialize = useAuthStore((state) => state.initialize);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);
    const markOnboardingSeen = useAuthStore((state) => state.markOnboardingSeen);
    const clearError = useAuthStore((state) => state.clearError);

    return {
        user,
        isLoading,
        initialized,
        isOnboardingSeen,
        error,
        initialize,
        login,
        logout,
        markOnboardingSeen,
        clearError,
    };
}
