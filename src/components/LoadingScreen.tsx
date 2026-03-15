export function LoadingScreen({ label = '로딩 중...' }: { label?: string }) {
    return (
        <div className="loading-screen" role="status" aria-live="polite">
            <div className="loading-spinner" />
            <p>{label}</p>
        </div>
    );
}
