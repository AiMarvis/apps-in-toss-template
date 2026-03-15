import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <main className="error-boundary">
                    <h1>일시적인 오류가 발생했습니다.</h1>
                    <p>앱을 다시 실행해 주세요.</p>
                </main>
            );
        }

        return this.props.children;
    }
}
