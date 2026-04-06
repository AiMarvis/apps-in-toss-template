---
name: appintoss-login
description: >
  AppsInToss (Toss mini-app) 로그인 기능 구현 A-Z 가이드. 토스 OAuth2 로그인, mTLS 인증서,
  AES-256-GCM 복호화, Firebase Auth (Custom Token), Firebase Cloud Functions (mTLS 게이트웨이),
  Convex 사용자 관리, 온보딩 페이지 UI, 인증 라우팅, 연동 해제 시 자동 리다이렉트를 포함한 전체 로그인 시스템 구현.
  Use when: (1) 새 앱인토스 프로젝트에 토스 로그인 기능 추가, (2) appLogin SDK 통합,
  (3) 토스 OAuth2 토큰 교환/사용자 정보 조회 구현, (4) mTLS 클라이언트 구현,
  (5) 토스 연동 해제 콜백 처리, (6) 온보딩/로그인 페이지 UI 구현,
  (7) 인증 가드 및 미로그인 리다이렉트, (8) 토스 로그인 관련 디버깅.
  Triggers: "토스 로그인", "toss login", "appLogin", "앱인토스 로그인", "toss OAuth",
  "mTLS", "토스 인증", "로그인 구현", "toss unlink callback", "연동 해제 콜백",
  "온보딩 페이지", "onboarding page", "로그인 페이지", "login page", "인증 가드".
---

# AppsInToss 로그인 구현 가이드 (Firebase + Convex)

토스 앱 내 미니앱에서 토스 로그인(OAuth2)을 구현하는 전체 워크플로우.
Firebase Cloud Functions를 mTLS 게이트웨이로 사용하고, Convex를 사용자 DB로 활용.

**아키텍처**:
```
[토스 앱] → appLogin() → [클라이언트] → authCode+referrer
  → [Firebase Cloud Functions] (mTLS 게이트웨이)
    → 토스 API generate-token (토큰교환)
    → 토스 API login-me (사용자정보 조회)
    → AES-256-GCM 복호화
    → Firebase Admin: createCustomToken()
  → [클라이언트] signInWithCustomToken()
  → [Convex] users.getOrCreate (사용자 upsert)
```

**기술 스택**:

| 레이어 | 기술 | 핵심 패턴 |
|--------|------|----------|
| 클라이언트 | React (Vite) + @apps-in-toss/web-framework | **Dynamic Import** (SDK 런타임 로드) |
| 상태관리 | Zustand | SDK Storage 래퍼 (앱 재설치에도 유지) |
| 인증 | Firebase Auth (Custom Token) | **Anonymous Auth 폴백** (비토스 환경) |
| mTLS 게이트웨이 | Firebase Cloud Functions v2 (**`onCall`**) | **Handler 분리** 패턴 |
| DB/API | Convex | 실시간 useQuery 동기화 |
| 토스 통신 | undici Agent + Node.js native fetch | 싱글톤 Agent + 재시도 |
| 환경변수 | Secret Manager (`defineSecret`) 또는 `functions/.env` | 인증서 Base64 저장 |

**전체 진행 순서** (반드시 이 순서대로. 건너뛰면 이후 단계 실패):
```
Phase 0: 이용약관 문서 생성 + 호스팅 등록
Phase 1: 토스 콘솔 설정 (약관 등록 → 로그인 활성화 → 복호화키 발급 → mTLS 발급)
Phase 2: 인프라 구축 (Firebase 프로젝트 → Cloud Functions 초기화 → Convex 설정)
Phase 3: 서버 구현 (Firebase Cloud Functions)
Phase 4: 클라이언트 구현
Phase 5: QA
```

---

## Phase 0: 이용약관 문서 생성 (가장 먼저)

**토스 콘솔에서 로그인 기능을 활성화하려면 이용약관 URL이 필수.**
약관이 없으면 mTLS 인증서도, 복호화 키도 발급받을 수 없다.

### 0.1 프로젝트 기본 정보 수집

AskUserQuestion으로 질문:
```
1. 프로젝트 이름? (서비스명, 영문)
2. 회사명? (이용약관에 표기할 법인명/상호)
3. 회사 이메일? (개인정보 처리방침에 표기할 이메일)
4. 서비스 설명? (한 줄 — 예: "출석체크로 포인트를 적립하는 서비스")
5. 개발 프레임워크? (React Native: @apps-in-toss/framework / WebView: @apps-in-toss/web-framework)
```

### 0.2 이용약관 + 개인정보처리방침 문서 작성

1. 코드베이스를 분석하여 서비스 기능, 수집 데이터 항목 파악
2. `.agent/skills/appintoss-login/assets/terms-template.md` 템플릿 기반으로 프로젝트에 맞게 작성:
   - `[서비스명]`, `[회사명]`, `[날짜]`, `[서비스 설명]` 등 플레이스홀더 교체
   - 서비스 기능 목록을 코드베이스에서 추출하여 제5조에 반영
   - 수집 개인정보 항목을 실제 사용하는 scope에 맞게 수정
3. **서비스이용약관, 개인정보처리방침 두 문서를 각각 분리**하여 작성
4. HTML 파일로 변환하여 호스팅

**등록 가능한 약관 유형** (상세: `.agent/skills/appintoss-login/references/toss-login-api.md` §9):
| 유형 | 필수/선택 | 비고 |
|------|----------|------|
| 서비스 이용약관 | **필수** | 권리/의무, 책임, 중단/종료, 분쟁 |
| 개인정보 수집/이용 동의 | **필수** | 수집 항목, 목적, 보유 기간, 거부 시 불이익 |
| 마케팅 정보 수신 동의 | 선택 | 전자적 전송매체 광고 수신 |
| 야간 혜택 수신 동의 | 선택 | 21:00~08:00 발송 명시 |

### 0.3 약관 호스팅 (Firebase Hosting 권장)

Firebase Hosting을 사용하면 Firebase 프로젝트 하나로 Functions + Hosting을 모두 관리 가능:

```bash
# 프로젝트 루트에서
mkdir -p firebase-hosting
# terms.html, privacy.html 생성 후

# firebase.json에 hosting 설정 추가
{
  "hosting": {
    "public": "firebase-hosting",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}

# 배포
firebase deploy --only hosting
```

배포 후 URL:
- `https://{프로젝트ID}.web.app/terms.html`
- `https://{프로젝트ID}.web.app/privacy.html`

> **대안**: Notion 페이지 공유 URL도 사용 가능하지만, Firebase Hosting이 더 안정적이고 브랜딩 통일에 유리.

AskUserQuestion: "이용약관/개인정보처리방침 URL이 준비되었나요?"

---

## Phase 1: 토스 콘솔 설정

**Phase 0에서 약관 URL을 확보한 후 진행. URL 없으면 이 단계 불가.**

### 1.1 약관 등록 + 로그인 활성화

사용자에게 안내:
```
1. 토스 개발자 콘솔 접속 (https://developers-apps-in-toss.toss.im)
2. **대표관리자** 계정으로 로그인 (대표관리자만 약관 동의/로그인 활성화 가능)
3. 워크스페이스 > 미니앱 > 토스 로그인 메뉴 진입
4. "약관 확인하기" 클릭
5. Phase 0에서 만든 URL을 약관 URL란에 입력
6. Scope(수집할 사용자 정보) 선택:
```

| scope | 설명 | 값 형식 | 주의 |
|-------|------|---------|------|
| USER_NAME | 이름 | 문자열 | - |
| USER_EMAIL | 이메일 | 문자열 | null 가능 (토스 가입 시 필수 아님) |
| USER_GENDER | 성별 | `MALE` / `FEMALE` | - |
| USER_BIRTHDAY | 생년월일 | `yyyyMMdd` | **콜백 필수** |
| USER_NATIONALITY | 국적 | `LOCAL` / `FOREIGNER` | **콜백 필수** |
| USER_PHONE | 전화번호 | 문자열 | **콜백 필수** |
| USER_CI | CI(본인인증) | 문자열 | **콜백 필수**, PII |

> **이름/이메일/성별 외 항목 선택 시 연결 끊기 콜백 정보 입력 필수.**

### 1.1.1 연결 끊기 콜백 정보 등록 (선택/조건부)

> **참고**: 이름/이메일/성별만 수집하는 경우 콜백은 선택 사항.
> 생년월일, 국적, 전화번호, CI 등을 수집하면 콜백 필수.

콘솔 하단 "연결 끊기 콜백 정보" 섹션에서 토글을 **설정**으로 변경 후 입력:

| 항목 | 입력값 | 예시 |
|------|--------|------|
| **콜백 URL** | `https://{region}-{projectId}.cloudfunctions.net/tossUnlinkCallback` | `https://us-central1-bookstream-toss.cloudfunctions.net/tossUnlinkCallback` |
| **HTTP 메서드** | GET 또는 POST (서버 구현에 맞게) | GET |
| **Basic Auth 헤더** | `{서비스명}:{비밀값}` (자유 형식) | `bookstream:toss-unlink-2026` |

```
7. "등록하기" 클릭 → 로그인 기능 활성화 완료
```

### 1.2 복호화 키 발급

**로그인 활성화 후에만 가능.** 사용자에게 안내:
```
1. 토스 콘솔 > 토스 로그인 > "이메일로 복호화 키 받기" 클릭
2. 대표관리자 이메일로 발송됨
3. 이메일에서 두 값을 안전하게 보관:
   - TOSS_DECRYPT_KEY: AES-256-GCM 복호화 키 (Base64 인코딩)
   - TOSS_DECRYPT_AAD: AAD 값 (UTF-8 평문)
4. *** 절대 외부 노출/커밋 금지 ***
```

### 1.3 mTLS 인증서 발급

**로그인 활성화 후에만 가능.** 사용자에게 안내:
```
1. 토스 콘솔 > 토스 로그인 > "인증서 발급" 클릭
2. ZIP 파일 다운로드 (cert.pem, key.pem 포함)
3. 안전한 위치에 보관 (프로젝트 루트에 두지 말 것, .gitignore 필수)
4. Firebase Functions 배포용 Base64 인코딩:
```

```bash
# macOS/Linux
base64 -i cert.pem | tr -d '\n' > cert_base64.txt
base64 -i key.pem | tr -d '\n' > key_base64.txt
```

### 1.4 Phase 1 완료 확인

AskUserQuestion:
```
토스 콘솔 설정이 모두 완료되었나요? 아래 항목을 확인해주세요:
1. 이용약관 URL 등록 완료?
2. 로그인 기능 활성화 완료?
3. 복호화 키(TOSS_DECRYPT_KEY, TOSS_DECRYPT_AAD) 수신 완료?
4. mTLS 인증서(cert.pem, key.pem) 다운로드 + Base64 인코딩 완료?
```

---

## Phase 2: 인프라 구축 (Firebase + Convex)

> **상세 가이드**: `.agent/skills/appintoss-login/references/infrastructure-setup.md`

### 2.0 선행 조건 확인 (필수!)

AskUserQuestion:
```
인프라 서비스가 준비되어 있나요? 아래 항목을 확인해주세요:

1. **Firebase 프로젝트** 있나요? (없으면 https://console.firebase.google.com 에서 생성)
2. **Firebase CLI** 설치했나요? (없으면: npm i -g firebase-tools → firebase login)
3. **Firebase Blaze 플랜** 활성화했나요? (Functions 배포에 필수 — 종량제, 무료 할당량 충분)
4. **Convex 프로젝트** 설정했나요? (없으면: npx convex dev)

각 항목에 대해 완료/미완료를 알려주세요.
```

### 2.1 Firebase Cloud Functions 초기화

```bash
# 프로젝트 루트에서
mkdir -p functions/src
cd functions

# package.json 생성
npm init -y
npm install firebase-admin firebase-functions undici
npm install -D typescript @types/node
```

`functions/tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2022",
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

`functions/package.json`에 추가:
```json
{
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "engines": { "node": "22" }
}
```

`firebase.json`:
```json
{
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix functions run build"]
  }
}
```

### 2.2 환경변수 설정

`functions/.env` 생성:
```env
TOSS_API_BASE_URL=https://apps-in-toss-api.toss.im
MTLS_CERT_BASE64={cert.pem Base64 인코딩값}
MTLS_KEY_BASE64={key.pem Base64 인코딩값}
TOSS_DECRYPT_KEY={복호화 키}
TOSS_DECRYPT_AAD={AAD}
```

> **Firebase Functions는 `functions/.env` 파일을 자동으로 읽습니다.**
> 배포 시 자동 업로드되므로 별도 환경변수 등록 불필요.

`.gitignore`에 반드시 추가:
```gitignore
functions/.env
functions/lib/
*.pem
mTLS_*.zip
cert_base64.txt
key_base64.txt
```

### 2.3 Convex 사용자 테이블

`convex/schema.ts`에 users 테이블 정의:

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    firebaseUid: v.string(),
    displayName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    tossUserKey: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_firebase_uid', ['firebaseUid']),
});
```

`convex/users.ts`:

```typescript
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getOrCreate = mutation({
  args: {
    firebaseUid: v.string(),
    displayName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    tossUserKey: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', args.firebaseUid))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastLoginAt: Date.now(),
        ...(args.displayName ? { displayName: args.displayName } : {}),
        ...(args.tossUserKey ? { tossUserKey: args.tossUserKey } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert('users', {
      firebaseUid: args.firebaseUid,
      displayName: args.displayName,
      photoUrl: args.photoUrl,
      tossUserKey: args.tossUserKey,
      lastLoginAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const me = query({
  args: { firebaseUid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', args.firebaseUid))
      .unique();
  },
});

export const deleteUser = mutation({
  args: { firebaseUid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_firebase_uid', (q) => q.eq('firebaseUid', args.firebaseUid))
      .unique();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});
```

### 2.4 Firebase 클라이언트 설정

`src/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...기타 설정
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : ({} as ReturnType<typeof getAuth>);
```

`.env.local` (클라이언트 환경변수):
```env
VITE_FIREBASE_API_KEY={Firebase Web API Key}
VITE_FIREBASE_AUTH_DOMAIN={projectId}.firebaseapp.com
VITE_FIREBASE_PROJECT_ID={projectId}
VITE_FIREBASE_FUNCTIONS_URL=https://{region}-{projectId}.cloudfunctions.net
VITE_CONVEX_URL=https://{deployment}.convex.cloud
```

---

## Phase 3: 서버 구현 (Firebase Cloud Functions — `onCall` 패턴)

### 핵심 파일 구조

```
functions/src/
  index.ts                      - onCall 진입점 (얇은 래퍼)
  handlers/tossAuthHandler.ts   - 비즈니스 로직 격리
  services/tlsClient.ts         - mTLS 싱글톤 Agent + 재시도
  services/tossAuth.ts          - 토큰교환 + 사용자정보 + AES-256-GCM 복호화
```

### 체크리스트

- [ ] **services/tlsClient.ts** — mTLS 싱글톤 Agent
  - **`undici`의 `Agent`** 사용 (**`https.Agent` 절대 금지!**)
  - 싱글톤 패턴 (Cold Start당 1회 생성)
  - `AbortController`로 요청 타임아웃 (8초)
  - socket hang up / ECONNRESET만 재시도 (최대 2회, 지수 백오프)

- [ ] **services/tossAuth.ts** — 토스 OAuth2
  - `exchangeToken()` → `/api-partner/v1/.../generate-token` (mTLS)
  - `getUserInfo()` → `/api-partner/v1/.../login-me` (mTLS + Bearer)
  - `decryptField()` → AES-256-GCM 복호화 (필드별 개별 복호화)
  - `tryDecrypt()` → 복호화 실패 시 null 반환 (앱 크래시 방지)
  - **`HttpsError`로 에러 전파** (일반 Error 사용 금지)

- [ ] **handlers/tossAuthHandler.ts** — 비즈니스 로직
  - 입력 검증 → 토큰교환 → 사용자정보 → 복호화 → Custom Token 생성
  - **개인정보 마스킹 로깅** (`name: "***"`)
  - `HttpsError`만 클라이언트에 전파

- [ ] **index.ts** — `onCall` 진입점
  - `onCall` 래퍼만 (Handler 위임)
  - region, timeout, cors 설정

### 구현 코드 패턴

#### services/tlsClient.ts (싱글톤 Agent + 재시도)
```typescript
import { Agent, type Dispatcher } from "undici";
import * as functions from "firebase-functions";

const TOSS_API_BASE_URL = "https://apps-in-toss-api.toss.im";
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 8000;

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("socket hang up") || msg.includes("econnreset");
  }
  return false;
}

// ⭐ 싱글톤 Agent (Cold Start당 1회 생성)
let cachedAgent: Agent | null = null;
function getAgent(): Agent {
  if (cachedAgent) return cachedAgent;
  const cert = Buffer.from(process.env.MTLS_CERT_BASE64!, "base64").toString("utf-8");
  const key = Buffer.from(process.env.MTLS_KEY_BASE64!, "base64").toString("utf-8");
  cachedAgent = new Agent({
    connect: { cert, key, rejectUnauthorized: true },
    keepAliveTimeout: 1000,
    connections: 10,
  });
  return cachedAgent;
}

export async function mtlsFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${TOSS_API_BASE_URL}${path}`;
  const agent = getAgent();
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, Math.min(500 * attempt, 1000)));
        functions.logger.warn(`[tlsClient] 재시도 ${attempt}/${MAX_RETRIES}`, { url });
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        return await fetch(url, {
          ...options,
          signal: controller.signal,
          // @ts-expect-error Node.js native fetch는 undici Dispatcher를 지원
          dispatcher: agent as Dispatcher,
        });
      } finally { clearTimeout(timeout); }
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error)) break;
    }
  }
  throw lastError;
}
```

#### services/tossAuth.ts (HttpsError + 필드별 복호화)
```typescript
import * as crypto from "crypto";
import * as functions from "firebase-functions";
import { mtlsFetch } from "./tlsClient";

const TOKEN_PATH = "/api-partner/v1/apps-in-toss/user/oauth2/generate-token";
const USER_INFO_PATH = "/api-partner/v1/apps-in-toss/user/oauth2/login-me";

export interface DecryptedUserInfo {
  userKey: number; scope: string; agreedTerms: string[];
  name?: string | null; email?: string | null; gender?: string | null;
}

function decryptField(encryptedText: string): string {
  const decoded = Buffer.from(encryptedText, "base64");
  const keyBuffer = Buffer.from(process.env.TOSS_DECRYPT_KEY!, "base64");
  const aadBuffer = Buffer.from(process.env.TOSS_DECRYPT_AAD!);
  const iv = decoded.subarray(0, 12);
  const ciphertextWithTag = decoded.subarray(12);
  const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16);
  const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
  decipher.setAuthTag(authTag);
  decipher.setAAD(aadBuffer);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
}

// ⭐ 복호화 실패해도 앱 크래시 방지
function tryDecrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  try { return decryptField(value); }
  catch { functions.logger.warn("[tossAuth] 필드 복호화 실패"); return null; }
}

// ⭐ HttpsError로 에러 전파 (일반 Error는 클라이언트에 전달 안 됨!)
export async function exchangeToken(authorizationCode: string, referrer: string) {
  const res = await mtlsFetch(TOKEN_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  const data = await res.json() as any;
  if (data.resultType !== "SUCCESS" || !data.success) {
    throw new functions.https.HttpsError("unauthenticated",
      `토큰 교환 실패: ${data.error?.errorCode ?? "UNKNOWN"}`);
  }
  return { accessToken: data.success.accessToken };
}

export async function getUserInfo(accessToken: string): Promise<DecryptedUserInfo> {
  const res = await mtlsFetch(USER_INFO_PATH, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json() as any;
  if (data.resultType !== "SUCCESS" || !data.success) {
    throw new functions.https.HttpsError("unauthenticated", "사용자 정보 조회 실패");
  }
  const user = data.success;
  return {
    userKey: user.userKey, scope: user.scope, agreedTerms: user.agreedTerms,
    name: tryDecrypt(user.name), email: user.email ?? null, gender: tryDecrypt(user.gender),
  };
}
```

#### handlers/tossAuthHandler.ts (비즈니스 로직 격리)
```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { exchangeToken, getUserInfo } from "../services/tossAuth";

export async function handleTossAuth(
  data: { authorizationCode?: string; referrer?: string },
  context: functions.https.CallableContext
): Promise<{ token: string }> {
  if (!data.authorizationCode) {
    throw new functions.https.HttpsError("invalid-argument", "authorizationCode는 필수");
  }

  try {
    const { accessToken } = await exchangeToken(data.authorizationCode, data.referrer ?? "DEFAULT");
    const userInfo = await getUserInfo(accessToken);
    const uid = `toss_${userInfo.userKey}`;
    const customToken = await admin.auth().createCustomToken(uid, {
      tossUserKey: userInfo.userKey,
    });

    // ⭐ 개인정보 마스킹 로깅
    functions.logger.info("[tossAuth] 로그인 성공", {
      uid, name: userInfo.name ? "***" : null,
    });
    return { token: customToken };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    functions.logger.error("[tossAuth] 에러", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new functions.https.HttpsError("internal", "토스 로그인 처리 중 오류 발생");
  }
}
```

#### index.ts (`onCall` — 얇은 래퍼)
```typescript
import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { handleTossAuth } from "./handlers/tossAuthHandler";

admin.initializeApp();

// ⭐ onCall: 자동 CORS, 자동 직렬화, HttpsError 전파
export const tossAuth = onCall(
  { region: "asia-northeast3", timeoutSeconds: 30, cors: true },
  async (request) => handleTossAuth(request.data, request)
);
```

> **`onCall` vs `onRequest` 차이점**:
> - `onCall`: 자동 CORS, `{ data: ... }` 래핑, `HttpsError` 클라이언트 전파, Firebase SDK `httpsCallable()` 호환
> - `onRequest`: 수동 CORS, 수동 HTTP 상태 코드, `res.json()` 수동 응답
> - **`onCall` 사용 시 클라이언트 요청 body**: `{ data: { authorizationCode, referrer } }`

---

## Phase 4: 클라이언트 구현 (Dynamic Import + Anonymous Auth 폴백)

### 핵심 파일 구조

```
src/
  firebase.ts              - Firebase 초기화
  services/tossAuth.ts     - ⭐ Dynamic Import + Anonymous Auth 폴백 + SDK Storage
  stores/authStore.ts      - Zustand (SDK Storage 비동기 연동)
  hooks/useAuth.ts         - 인증 훅
  pages/OnboardingPage.tsx - 온보딩(로그인) 페이지
  App.tsx                  - 라우팅 설정
```

### 체크리스트

- [ ] **services/tossAuth.ts** — ⭐ 최선진 패턴
  - `loadSdkModule()`: **Dynamic Import** (Static import 절대 금지!)
  - `loginWithToss(auth)`: SDK → appLogin → Token교환 → signIn
    - **3단계 Anonymous Auth 폴백**: SDK 미로드 / appLogin 실패 / 토큰교환 실패
  - `checkTossIntegration()`: Dynamic Import로 연동 확인
  - `clearSessionForDisconnect()`: Convex 키 + 앱 키 정리
  - `isTossUser(user)`: UID가 'toss_'로 시작하는지 확인
  - `shareMiniApp()`: Dynamic Import로 공유 (navigator.share 금지)
  - **SDK Storage 래퍼**: `getStorageValue()`, `setStorageValue()`, `removeStorageValue()`

- [ ] **stores/authStore.ts** — SDK Storage 연동
  - `initialize()`: SDK Storage에서 온보딩 상태 **비동기** 로드
  - `markOnboardingSeen()`: fire-and-forget (UI 즉시 반영 + 백그라운드 저장)
  - `logout()`: SDK Storage도 정리! (`removeStorageValue`)

### 구현 코드 패턴

#### services/tossAuth.ts (⭐ 최선진 패턴)
```typescript
// ⚠️ Static import 금지! → Dynamic Import로 SDK 로드
import { signInWithCustomToken, signOut, type Auth, type User } from 'firebase/auth';

const CONVEX_AUTH_PREFIX = '__convexAuth';
const APP_KEY_PREFIXES = ['{프로젝트명}_'];

type AppLoginResult = {
  token?: string; customToken?: string;
  authorizationCode?: string; referrer?: string;
};

// ⭐ Dynamic Import — 웹 환경 크래시 방지 + 번들 크기 최적화
async function loadSdkModule() {
  try { return await import('@apps-in-toss/web-framework'); }
  catch { console.warn('[tossAuth] SDK 로드 실패 — 웹 환경일 수 있습니다.'); return null; }
}

// ⭐ SDK Storage 래퍼 — 앱 재설치에도 데이터 유지
export async function getStorageValue(key: string): Promise<string | null> {
  try {
    const sdk = await import('@apps-in-toss/web-framework');
    if (sdk.Storage?.getItem) return await sdk.Storage.getItem(key);
  } catch { /* 폴백 */ }
  return localStorage.getItem(key);
}
export async function setStorageValue(key: string, value: string): Promise<void> {
  try {
    const sdk = await import('@apps-in-toss/web-framework');
    if (sdk.Storage?.setItem) { await sdk.Storage.setItem(key, value); return; }
  } catch { /* 폴백 */ }
  localStorage.setItem(key, value);
}
export async function removeStorageValue(key: string): Promise<void> {
  try {
    const sdk = await import('@apps-in-toss/web-framework');
    if (sdk.Storage?.removeItem) { await sdk.Storage.removeItem(key); return; }
  } catch { /* 폴백 */ }
  localStorage.removeItem(key);
}

// onCall 방식: body를 { data: {...} }로 래핑
async function exchangeAuthorizationCode(authorizationCode: string, referrer?: string): Promise<string> {
  const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
  const response = await fetch(`${functionsUrl}/tossAuth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { authorizationCode, referrer: referrer ?? '' } }),
  });
  if (!response.ok) throw new Error(`교환 실패: ${await response.text()}`);
  const json = await response.json() as { result?: { token?: string } };
  const token = json.result?.token;
  if (!token) throw new Error('Custom token missing');
  return token;
}

// ⭐ 3단계 Anonymous Auth 폴백
export async function loginWithToss(auth: Auth): Promise<User> {
  const sdk = await loadSdkModule();

  // 1단계: SDK 미로드 → Anonymous Auth
  if (!sdk || !sdk.appLogin) {
    console.warn('[tossAuth] SDK 미지원 → Anonymous Auth');
    const { signInAnonymously } = await import('firebase/auth');
    return (await signInAnonymously(auth)).user;
  }

  // 2단계: appLogin() 실패 → Anonymous Auth
  let result: AppLoginResult;
  try { result = (await sdk.appLogin()) as AppLoginResult; }
  catch (e) {
    console.warn('[tossAuth] appLogin() 실패 → Anonymous Auth', e);
    const { signInAnonymously } = await import('firebase/auth');
    return (await signInAnonymously(auth)).user;
  }

  // 3단계: 토큰 교환 실패 → Anonymous Auth
  try {
    const directToken = result.token ?? result.customToken;
    const token = directToken
      ? directToken
      : await exchangeAuthorizationCode(result.authorizationCode ?? '', result.referrer);
    return (await signInWithCustomToken(auth, token)).user;
  } catch (e) {
    console.warn('[tossAuth] 토큰 교환 실패 → Anonymous Auth', e);
    const { signInAnonymously } = await import('firebase/auth');
    return (await signInAnonymously(auth)).user;
  }
}

// ⭐ Dynamic Import로 연동 확인
export async function checkTossIntegration(): Promise<boolean | undefined> {
  try {
    const sdk = await loadSdkModule();
    if (!sdk?.getIsTossLoginIntegratedService) return undefined;
    return await sdk.getIsTossLoginIntegratedService();
  } catch { return undefined; }
}

export function isTossUser(user: User | null): boolean {
  return Boolean(user?.uid?.startsWith('toss_'));
}

export function clearSessionForDisconnect(extraKeyPrefixes: string[] = []): void {
  const prefixes = [...APP_KEY_PREFIXES, ...extraKeyPrefixes];
  const shouldDelete = (key: string): boolean =>
    key.startsWith(CONVEX_AUTH_PREFIX) || prefixes.some((p) => key.startsWith(p));
  for (const key of Object.keys(localStorage)) {
    if (shouldDelete(key)) localStorage.removeItem(key);
  }
  for (const key of Object.keys(sessionStorage)) {
    if (shouldDelete(key)) sessionStorage.removeItem(key);
  }
}

export async function logoutAndClear(auth: Auth): Promise<void> {
  clearSessionForDisconnect();
  await signOut(auth);
}

// ⭐ navigator.share() 절대 금지 → SDK share() 사용
export async function shareMiniApp(params: { appScheme: string; title: string }): Promise<void> {
  const sdk = await loadSdkModule();
  if (!sdk?.getTossShareLink || !sdk?.share) {
    console.warn('[tossAuth] 공유 기능은 토스 앱에서만 가능');
    return;
  }
  const url = await sdk.getTossShareLink(`intoss://${params.appScheme}`);
  await sdk.share({ message: `${params.title}\n${url}` });
}
```

#### stores/authStore.ts (SDK Storage 비동기 연동)
```typescript
import { create } from 'zustand';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import {
  checkTossIntegration, clearSessionForDisconnect, loginWithToss, isTossUser,
  getStorageValue, setStorageValue, removeStorageValue,
} from '../services/tossAuth';

const ONBOARDING_KEY = '{프로젝트명}_onboarding_seen';

interface AuthState {
  user: User | null; isLoading: boolean; initialized: boolean;
  isOnboardingSeen: boolean; error: string | null;
  initialize: () => Promise<void>;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  markOnboardingSeen: () => void;
  clearError: () => void;
}

async function guardDisconnect(user: User | null): Promise<boolean> {
  if (!isTossUser(user)) return true;
  const isLinked = await checkTossIntegration();
  if (isLinked === false) {  // ⚠️ 엄격 비교 필수!
    clearSessionForDisconnect();
    await signOut(auth);
    return false;
  }
  return true;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, isLoading: true, initialized: false,
  isOnboardingSeen: false, error: null,

  initialize: async () => {
    if (get().initialized) return;
    if (!isFirebaseConfigured) { set({ isLoading: false, initialized: true }); return; }

    // ⭐ SDK Storage에서 온보딩 상태 비동기 로드
    const onboardingValue = await getStorageValue(ONBOARDING_KEY);
    if (onboardingValue === 'true') set({ isOnboardingSeen: true });

    onAuthStateChanged(auth, async (firebaseUser) => {
      const isAllowed = await guardDisconnect(firebaseUser);
      set({ user: isAllowed ? firebaseUser : null, isLoading: false, initialized: true });
    });
  },

  login: async () => {
    if (!isFirebaseConfigured) { set({ error: 'Firebase 설정 필요' }); return false; }
    set({ isLoading: true, error: null });
    try {
      await loginWithToss(auth);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '로그인 실패' });
      return false;
    }
  },

  logout: async () => {
    clearSessionForDisconnect();
    if (isFirebaseConfigured) await signOut(auth);
    // ⭐ SDK Storage도 정리!
    await removeStorageValue(ONBOARDING_KEY);
    set({ user: null, error: null, isOnboardingSeen: false });
  },

  // ⭐ fire-and-forget: UI 즉시 반영 + 백그라운드 저장
  markOnboardingSeen: () => {
    setStorageValue(ONBOARDING_KEY, 'true').catch(console.error);
    set({ isOnboardingSeen: true });
  },

  clearError: () => set({ error: null }),
}));
```

#### OnboardingPage.tsx — 로그인 후 Convex upsert
```typescript
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';

export default function OnboardingPage() {
  const { login, markOnboardingSeen, isLoading, error, clearError } = useAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreate);

  const handleLogin = async () => {
    clearError();
    const success = await login();
    if (success) {
      const state = useAuthStore.getState();
      if (state.user) {
        try {
          await getOrCreateUser({
            firebaseUid: state.user.uid,
            displayName: state.user.displayName ?? undefined,
          });
        } catch (e) {
          console.warn('Convex upsert 실패:', e);
        }
      }
      markOnboardingSeen();
    }
  };
  // ... UI 렌더링
}
```

### 클라이언트 플로우

**로그인 플로우 (최선진 패턴):**
```
[온보딩 페이지] → "토스로 시작하기"
  → Dynamic Import SDK
    → 성공: appLogin() → 인가코드
      → POST Functions /tossAuth { data: { authorizationCode, referrer } }
      → signInWithCustomToken()
    → 실패 (3단계 어디서든): Anonymous Auth 폴백
  → Convex: users.getOrCreate
  → 메인 화면
```

**연동 해제 → 재로그인 플로우:**
```
[토스앱에서 연결 끊기]
  → guardDisconnect() → isLinked === false
  → clearSessionForDisconnect() + signOut()
  → /onboarding 리다이렉트
  → 재로그인: 정상 진행
```

---

## Phase 5: QA (공식 체크리스트 + 최선진 패턴 검증)

| 범주 | 항목 | 확인 내용 |
|------|------|----------|
| 사전 | 콘솔 설정 | 앱인토스 콘솔에서 로그인 기능 승인 상태 |
| 사전 | 약관 링크 | 이용약관 + 개인정보처리방침 URL 정상 작동 |
| 사전 | Firebase Blaze | Blaze 플랜 활성화 확인 (Functions 배포 필수) |
| **로그인** | 최초 로그인 | appLogin → Functions `/tossAuth` → Custom Token → signIn → Convex upsert |
| **로그인** | 재로그인 | 약관 동의 없이 인가 코드 즉시 수신, 정상 진입 |
| **로그인** | onCall body | 요청이 `{ data: { authorizationCode, referrer } }` 형태인지 확인 |
| **연동해제** | 감지 | guardDisconnect()가 `isLinked === false` 엄격 비교 감지 → 자동 로그아웃 |
| **연동해제** | 재로그인 | 재로그인 정상, Convex에 새 데이터 upsert |
| **연동해제** | 3지점 재검증 | 앱 시작 + onAuthStateChanged + visibilitychange |
| ⭐ **Dynamic Import** | SDK 로드 | `import('@apps-in-toss/web-framework')` — Static import 절대 없음 |
| ⭐ **Anonymous Auth** | 1단계 | SDK 미로드 시 `signInAnonymously()` 폴백 |
| ⭐ **Anonymous Auth** | 2단계 | `appLogin()` 실패 시 `signInAnonymously()` 폴백 |
| ⭐ **Anonymous Auth** | 3단계 | 토큰 교환 실패 시 `signInAnonymously()` 폴백 |
| ⭐ **SDK Storage** | 온보딩 저장 | `Storage.setItem`/`getItem` → localStorage 폴백 |
| ⭐ **SDK Storage** | 로그아웃 정리 | `removeStorageValue()` 호출 + localStorage도 정리 |
| **서버** | mTLS | `undici Agent` 싱글톤 사용 확인 (Node.js `https.Agent` 사용 금지) |
| **서버** | 개인정보 마스킹 | 로그에 `name: "***"` 패턴 사용 |
| **서버** | onCall 에러 | `HttpsError` 사용 → 클라이언트에 에러 전파 |
| UI | 에러 피드백 | 로그인 실패 시 에러 메시지 UI 표시 |
| UI | 공유 | `navigator.share()` 대신 SDK `share()` + `getTossShareLink()` 사용 |
| 기타 | 샌드박스 | referrer=SANDBOX 환경 테스트 |
| 기타 | mTLS 인증서 | 만료일 확인 + 갱신 알림 설정 |

---

## Vercel → Firebase 마이그레이션 비교표

| 항목 | 기존 (Vercel + Supabase) | 현재 (Firebase + Convex) |
|------|-------------------------|-------------------------|
| mTLS 게이트웨이 | Vercel Serverless Functions | Firebase Cloud Functions v2 |
| 인증 | 자체 JWT 발급/검증 | Firebase Auth Custom Token |
| 사용자 DB | Supabase PostgreSQL | Convex |
| 사용자 식별 | JWT payload (userId) | Firebase UID (`toss_{userKey}`) |
| 토큰 관리 | 자체 accessToken/refreshToken | Firebase Auth 자동 관리 |
| 연동 해제 감지 | 서버 콜백 → TOKEN_REVOKED | 클라이언트 `getIsTossLoginIntegratedService()` |
| 상태관리 | Zustand persist (localStorage) | Zustand (+ Firebase Auth 상태) |
| 환경변수 | Vercel CLI (`echo -n` 필수) | `functions/.env` 파일 |

### 핵심 차이점
1. **JWT 자체 발급 불필요**: Firebase Auth가 토큰 관리 (발급/갱신/검증)를 자동 처리
2. **별도 서버 프로젝트 불필요**: `functions/` 디렉토리가 프로젝트 내에 포함
3. **Convex 실시간**: `useQuery()`로 사용자 데이터 실시간 동기화
4. **간결한 연동 해제**: 서버 콜백 없이 클라이언트에서 `getIsTossLoginIntegratedService()`로 직접 감지

---

## References

- **.agent/skills/appintoss-login/references/infrastructure-setup.md**: Firebase/Convex 프로젝트 설정, CLI 설치, 환경변수 가이드
- **.agent/skills/appintoss-login/references/toss-login-api.md**: 토스 API 전체 스펙 (SDK, 토큰교환, 사용자정보, 복호화, 콜백, scope, 약관)
- **.agent/skills/appintoss-login/references/bookstream-reference.md**: BookStream 구현 (Firebase Auth + Convex, `onRequest`, `undici` mTLS)
- **.agent/skills/appintoss-login/references/crowdpicks-reference.md**: CrowdPicks 구현 (Firebase Auth + Convex, `onRequest` + `defineSecret`, Node.js `https` mTLS)
- **.agent/skills/appintoss-login/references/meditation-reference.md**: Soom(명상) 구현 (**Convex Auth 직접 연동**, Firebase Auth 미사용, 고유 패턴)
- **.agent/skills/appintoss-login/references/ourkidscafe-reference.md**: OurKidsCafe 구현 ⭐ (최선진 패턴: `onCall`, Dynamic Import, Anonymous Auth 폴백, SDK Storage)
- **.agent/skills/appintoss-login/assets/terms-template.md**: 이용약관 + 개인정보 수집 동의 한국어 템플릿
- 토스 공식: [콘솔](https://developers-apps-in-toss.toss.im/login/console.html) | [개발](https://developers-apps-in-toss.toss.im/login/develop.html) | [QA](https://developers-apps-in-toss.toss.im/login/qa.html) | [appLogin](https://developers-apps-in-toss.toss.im/bedrock/.agent/skills/appintoss-login/reference/framework/로그인/appLogin.html)
