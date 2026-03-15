import {
    appLogin,
    getIsTossLoginIntegratedService,
    getTossShareLink,
    share,
} from '@apps-in-toss/web-framework';
import { signInWithCustomToken, signOut, type Auth, type User } from 'firebase/auth';

// TODO: 앱 이름에 맞게 KEY 프리픽스 변경
const CONVEX_AUTH_PREFIX = '__convexAuth';
const APP_KEY_PREFIXES = ['myapp_'];

type AppLoginResult = {
    token?: string;
    customToken?: string;
    authorizationCode?: string;
    referrer?: string;
};

/**
 * 인가 코드를 Firebase Custom Token으로 교환
 * mTLS가 필요하므로 Firebase Cloud Functions 프록시를 거칩니다.
 */
async function exchangeAuthorizationCode(authorizationCode: string, referrer?: string): Promise<string> {
    const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;

    if (!functionsUrl) {
        throw new Error('VITE_FIREBASE_FUNCTIONS_URL is required when appLogin() does not return a token.');
    }

    const response = await fetch(`${functionsUrl}/tossAuth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { authorizationCode, referrer: referrer ?? '' } }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to exchange authorization code: ${body}`);
    }

    const json = (await response.json()) as {
        result?: { token?: string; customToken?: string };
    };

    const token = json.result?.token ?? json.result?.customToken;
    if (!token) {
        throw new Error('Custom token missing in tossAuth response.');
    }

    return token;
}

/**
 * 토스 앱 로그인 → Firebase Custom Token → signIn
 */
export async function loginWithToss(auth: Auth): Promise<User> {
    const result = (await appLogin()) as AppLoginResult;

    const directToken = result.token ?? result.customToken;
    const token = directToken
        ? directToken
        : await exchangeAuthorizationCode(result.authorizationCode ?? '', result.referrer);

    const credential = await signInWithCustomToken(auth, token);
    return credential.user;
}

/**
 * 토스 로그인 연동 상태 확인
 * ⚠️ isLinked === false 엄격 비교 필수!
 */
export async function checkTossIntegration(): Promise<boolean | undefined> {
    try {
        return await getIsTossLoginIntegratedService();
    } catch {
        return undefined;
    }
}

/**
 * 연동 해제 시 세션 데이터 정리
 * - Convex 인증 키 (__convexAuth*)
 * - 앱 커스텀 키 (APP_KEY_PREFIXES)
 * - localStorage + sessionStorage 모두 정리
 */
export function clearSessionForDisconnect(extraKeyPrefixes: string[] = []): void {
    const prefixes = [...APP_KEY_PREFIXES, ...extraKeyPrefixes];

    const shouldDelete = (key: string): boolean => {
        if (key.startsWith(CONVEX_AUTH_PREFIX)) {
            return true;
        }
        return prefixes.some((prefix) => key.startsWith(prefix));
    };

    for (const key of Object.keys(localStorage)) {
        if (shouldDelete(key)) {
            localStorage.removeItem(key);
        }
    }

    for (const key of Object.keys(sessionStorage)) {
        if (shouldDelete(key)) {
            sessionStorage.removeItem(key);
        }
    }
}

/**
 * 로그아웃 + 세션 정리
 */
export async function logoutAndClear(auth: Auth): Promise<void> {
    clearSessionForDisconnect();
    await signOut(auth);
}

/**
 * 토스 사용자인지 확인 (uid가 'toss_'로 시작)
 */
export function isTossUser(user: User | null): boolean {
    return Boolean(user?.uid?.startsWith('toss_'));
}

/**
 * 미니앱 공유
 * ⚠️ navigator.share() 절대 사용 금지 → SDK share() 사용
 */
export async function shareMiniApp(params: { appScheme: string; title: string }): Promise<void> {
    const url = await getTossShareLink(`intoss://${params.appScheme}`);
    await share({ message: `${params.title}\n${url}` });
}
