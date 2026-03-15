# 토스 로그인 개발 가이드

> **원본**: https://developers-apps-in-toss.toss.im/login/develop.md
> **생성일**: 2026-03-06

---

## 인증 플로우 개요

```
사용자 → 토스 앱 로그인 → appLogin() 호출
→ 인가 코드 발급 → 서버에서 토큰 교환 (mTLS)
→ Firebase Custom Token 생성 → signInWithCustomToken()
→ Firebase JWT → Convex에서 JWT 검증 → 사용자 식별
```

---

## SDK API 요약

### appLogin() — 인가 코드 받기

```typescript
import { appLogin } from '@apps-in-toss/web-framework';

const result = await appLogin();
// result.code: 인가 코드 (서버로 전송하여 토큰 교환)
```

### getIsTossLoginIntegratedService() — 연동 상태 확인

```typescript
import { getIsTossLoginIntegratedService } from '@apps-in-toss/web-framework';

const isLinked = await getIsTossLoginIntegratedService();

// ⚠️ 엄격 비교 필수!
if (isLinked === false) {
  // 연동 해제됨 → 로그아웃 + 저장소 초기화
}
```

---

## 서버 사이드 (Firebase Cloud Functions — 인증 게이트웨이 전용)

### 토큰 교환 (mTLS 필요)

```
POST https://oauth2.toss.im/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={인가코드}
&client_id={클라이언트ID}
&client_secret={클라이언트시크릿}
&redirect_uri={리다이렉트URI}
```

> ⚠️ mTLS 인증서 필요 → Firebase Cloud Functions에서 프록시
> 일반 비즈니스 API는 Convex Action 사용 (Cloud Functions 금지)

### Firebase Custom Token 생성

```typescript
// Firebase Admin SDK
const customToken = await admin.auth().createCustomToken(userKey, {
  toss_user: true,
});
```

---

## 연동 해제 처리 (필수)

```typescript
// 최소 3지점에서 재검증:
// 1) 앱 시작 시
// 2) onAuthStateChanged 콜백
// 3) visibilitychange 이벤트

const checkIntegration = async () => {
  const isLinked = await getIsTossLoginIntegratedService();
  if (isLinked === false) {
    // 1. Firebase 로그아웃
    await auth.signOut();
    // 2. 저장소 정리
    clearSessionForDisconnect(['myapp_']); // 앱 커스텀 키 prefix
    // 3. SDK 저장소 정리
    await Storage.clearItems();
    // 4. 로그인 화면으로 리다이렉트
    navigate('/onboarding');
  }
};
```

---

## 주의사항

| 항목 | 설명 |
|------|------|
| 로그인 타이밍 | 인트로 뷰 **이후**에 진행 (앱 시작 직후 ❌) |
| 이용약관 | 자체 약관 **제거** → 토스 로그인 플로우에서 동의 |
| 자체 로그아웃 | 없어도 됨 (연동 해제 → 로그아웃 → 재로그인 플로우만) |
| 엄격 비교 | `isLinked === false` (❌ `!isLinked`) |
| 면책 | 사업자 없어도 앱 출시 가능 |

---

## 참고 링크

- [토스 로그인 이해하기](https://developers-apps-in-toss.toss.im/login/intro.md)
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/login/console.md)
- [QA 진행하기](https://developers-apps-in-toss.toss.im/login/qa.md)
- [appLogin SDK](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/로그인/appLogin.md)
- [getIsTossLoginIntegratedService SDK](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/로그인/getIsTossLoginIntegratedService.md)
