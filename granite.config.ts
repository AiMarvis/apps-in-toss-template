import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
    // TODO: 앱 등록 후 콘솔에서 발급받은 appName으로 변경
    appName: 'my-app',
    brand: {
        // TODO: 앱 표시 이름
        displayName: '내 앱',
        // TODO: 브랜드 기본 색상 (TDS 기본 파란색)
        primaryColor: '#3182F6',
        // TODO: 앱 아이콘 URL (Convex Storage 또는 CDN)
        icon: 'https://your-convex.convex.cloud/api/storage/your-icon-id',
    },
    web: {
        host: 'localhost',
        port: 5173,
        commands: {
            dev: 'vite --host --port 5173 --strictPort',
            build: 'tsc -b && vite build',
        },
    },
    // TODO: 필요한 권한 추가 (위치, 카메라 등)
    permissions: [],
    outdir: 'dist',
    webViewProps: {
        type: 'partner',
    },
});
