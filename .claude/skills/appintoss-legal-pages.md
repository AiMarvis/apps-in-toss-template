---
name: appintoss-legal-pages
description: 앱인토스(Apps-in-Toss) 미니앱용 서비스이용약관 및 개인정보처리방침 정적 HTML 페이지를 생성하고 Firebase Hosting에 배포하여 공개 URL을 제공하는 스킬. 토스 로그인 연동 등록 시 필수로 요구되는 이용약관/개인정보처리방침 URL을 자동 생성한다. Use when: (1) 새 앱인토스 미니앱에 이용약관/개인정보처리방침 URL이 필요할 때, (2) 토스 로그인 연동 등록 시 약관 URL을 입력해야 할 때, (3) Firebase Hosting에 법적 문서를 배포해야 할 때, (4) 기존 약관/개인정보처리방침 페이지를 수정해야 할 때. Triggers: "이용약관", "개인정보처리방침", "privacy policy", "terms of service", "약관 URL", "법적 문서", "토스 로그인 등록", "legal pages", "약관 만들기", "약관 페이지", "서비스 약관".
---

# 앱인토스 법적 문서 페이지 생성 스킬

토스 로그인 연동 등록 시 **서비스 이용약관 URL**과 **개인정보처리방침 URL**이 필수이다.
이 스킬은 정적 HTML 페이지를 생성하고 Firebase Hosting에 배포하여 공개 URL을 제공한다.

## 필수 입력 정보

시작 전 사용자에게 아래 정보를 확인한다 (없으면 질문):

| 항목 | 예시 | 필수 |
|------|------|:----:|
| 앱 이름 | BookStream | ✅ |
| 회사명 (또는 개인 사업자명) | innerbuilder | ✅ |
| 연락 이메일 | contact@example.com | ✅ |
| Firebase 프로젝트 ID | bookstream-toss | ✅ |
| 시행일 | 오늘 날짜 (기본값) | 선택 |
| 수집하는 개인정보 항목 | 토스 사용자 CI (기본) | 선택 |
| 데이터 위탁 업체 | Convex, Firebase (기본) | 선택 |
| 서비스 설명 (한 줄) | 독서 기록 관리 서비스 | 선택 |

## 워크플로우

### Step 1: 프로젝트 디렉토리 생성

```bash
mkdir -p firebase-hosting
```

### Step 2: 이용약관 HTML 생성

`firebase-hosting/terms.html` 파일을 생성한다. 
`.agent/skills/appintoss-legal-pages/references/terms-template.html`을 참조하여 사용자 정보를 치환한다.

**치환 변수:**
- `{{APP_NAME}}` → 앱 이름
- `{{COMPANY_NAME}}` → 회사명
- `{{EFFECTIVE_DATE}}` → 시행일 (YYYY년 M월 D일)
- `{{SERVICE_DESC}}` → 서비스 설명
- `{{CONTACT_EMAIL}}` → 연락 이메일

### Step 3: 개인정보처리방침 HTML 생성

`firebase-hosting/privacy.html` 파일을 생성한다.
`.agent/skills/appintoss-legal-pages/references/privacy-template.html`을 참조하여 사용자 정보를 치환한다.

**추가 치환 변수:**
- `{{DATA_ITEMS}}` → 수집하는 개인정보 항목 테이블
- `{{DATA_PROCESSORS}}` → 위탁 업체 테이블

### Step 4: Firebase Hosting 설정

`firebase.json` (없을 경우 생성):
```json
{
  "hosting": {
    "public": "firebase-hosting",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [{"source": "**", "headers": [{"key": "Cache-Control", "value": "public, max-age=3600"}]}]
  }
}
```

`.firebaserc` (없을 경우 생성):
```json
{
  "projects": { "default": "{{FIREBASE_PROJECT_ID}}" }
}
```

### Step 5: 배포

```bash
npx firebase-tools deploy --only hosting --project {{FIREBASE_PROJECT_ID}}
```

### Step 6: URL 전달

배포 완료 후 아래 URL을 사용자에게 전달:

| 페이지 | URL |
|--------|-----|
| 서비스 이용약관 | `https://{{FIREBASE_PROJECT_ID}}.web.app/terms.html` |
| 개인정보처리방침 | `https://{{FIREBASE_PROJECT_ID}}.web.app/privacy.html` |

## 주의 사항

- 앱인토스 규칙: **자체 이용약관 제거**, 토스 로그인 플로우에서 약관 동의 → 이 페이지는 **토스 콘솔 등록용 URL**이지 앱 내 표시용이 아님
- 연동 해제 시 데이터 즉시 삭제 처리를 약관에 반드시 명시
- 다크모드(`prefers-color-scheme: dark`) 대응 필수
- `user-scalable=no` viewport 메타 반드시 포함
- `.gitignore`에 Firebase 캐시 추가: `.firebase/`

## 디자인 원칙

- TDS 호환 느낌의 깔끔한 정적 HTML (앱인토스 환경에서 열릴 수 있으므로)
- 모바일 최적화: `max-width: 640px`, 적절한 패딩
- 폰트: Apple SD Gothic Neo, Noto Sans KR 시스템 폰트 스택
- 색상: 토스 컬러 톤 (#191f28, #4e5968, #8b95a1)
