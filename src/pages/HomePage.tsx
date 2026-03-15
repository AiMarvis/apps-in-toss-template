import { useAuth } from '../hooks/useAuth';

// TODO: 앱 고유 홈 페이지 구현
export default function HomePage() {
    const { user } = useAuth();

    return (
        <main className="page-container">
            <section className="home-hero">
                <h1>환영합니다! 🎉</h1>
                {user && <p>안녕하세요, {user.displayName || '사용자'}님</p>}
                <p className="text-secondary">여기에 앱 메인 콘텐츠를 구현하세요.</p>
            </section>
        </main>
    );
}
