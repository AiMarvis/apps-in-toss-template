import { useAuth } from '../hooks/useAuth';

/**
 * 온보딩 페이지
 *
 * ⚠️ 토스 로그인은 인트로 뷰 이후에 진행 (앱 시작 직후 로그인 화면 노출 금지)
 * ⚠️ 이 화면에서 백버튼 시 closeView()로 앱 종료되어야 함
 */
export default function OnboardingPage() {
    const { login, markOnboardingSeen, isLoading, error, clearError } = useAuth();

    const handleLogin = async () => {
        clearError();
        const success = await login();
        if (success) {
            markOnboardingSeen();
        }
    };

    return (
        <main className="page-container onboarding">
            <section className="onboarding-content">
                {/* TODO: 앱 로고/소개 이미지 */}
                <h1>앱 이름</h1>
                <p className="text-secondary">앱 소개 문구를 입력하세요.</p>

                {error && (
                    <div className="error-message" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                <button
                    className="btn-primary"
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? '로그인 중...' : '토스 로그인으로 시작하기'}
                </button>
            </section>
        </main>
    );
}
