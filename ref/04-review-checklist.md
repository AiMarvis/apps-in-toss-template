# 앱인토스 검수 통과 체크리스트

> 실전 반려사례 DB + Obsidian 전략 문서에서 추출한 통합 체크리스트
> **생성일**: 2026-03-06

---

## 🔥 반려 패턴 TOP 3

| 순위 | 패턴 | 건수 | 우선순위 |
|------|------|------|----------|
| 1 | 자체 백버튼 사용 / 홈 백버튼 미종료 | 16 | P0 |
| 2 | 토스 로그인 연동 해제 콜백 미처리 | 8 | P0 |
| 3 | 기능 스킨 404 / 네비게이션 무반응 | 6 | P1 |

---

## 제출 전 15분 게이트

| 게이트 | 기준 | 실패 시 조치 |
|--------|------|-------------|
| G1 네비게이션 | 홈/온보딩 백버튼에서 앱 종료 | 라우터/SDK 이벤트 우선 수정 |
| G2 인증 | 연동 해제 시 즉시 로그아웃 + 재로그인 | 저장소/서버 데이터 정리 점검 |
| G3 스킨 | 등록된 기능 스킨 전부 404 없음 | 라우트 맵/딥링크 재검토 |
| G4 TDS/UI | AlertDialog/권한/클릭 이벤트 정상 | Props 누락, pointer-events 점검 |

---

## 전체 체크리스트

### 🔙 P0-1: 네비게이션
- [ ] 자체 구현 백버튼/뒤로가기 버튼 **모두 제거**
- [ ] 공통 내비게이션 백버튼으로 히스토리 백 동작
- [ ] 최초 화면(온보딩/랜딩)에서 백버튼 시 **미니앱 종료** (closeView)
- [ ] `graniteEvent.addEventListener('backEvent')` 등록됨
- [ ] `popstate` 이벤트 사용 **없음**
- [ ] 공통 내비게이션 앱 아이콘/로고 정상 노출
- [ ] 자체 햄버거 메뉴 **제거** → 공통 내비게이션 커스텀 활용
- [ ] 기능 스킨 접속 시 백버튼/커스텀 버튼 정상 동작

### 🔐 P0-2: 인증 & 연동 해제
- [ ] 토스 로그인은 **인트로 뷰 이후** 진행
- [ ] 자체 이용약관 **제거** → 토스 로그인 플로우에서 동의
- [ ] `getIsTossLoginIntegratedService()` 체크 존재 (최소 3지점)
  - [ ] 앱 시작 시
  - [ ] `onAuthStateChanged` 콜백
  - [ ] `visibilitychange` 이벤트 (포그라운드 복귀)
- [ ] `isLinked === false` **엄격 비교** (`!isLinked` 금지)
- [ ] 연동 해제 시 즉시:
  - [ ] `auth.signOut()` 호출
  - [ ] `localStorage` 정리 (`__convexAuth*` + 앱 커스텀 키)
  - [ ] `sessionStorage` 정리
  - [ ] 로그인 화면 리다이렉트
- [ ] 연동 해제 후 **재로그인 플로우** 정상 동작
- [ ] 재연동 시 온보딩 다시 표시

### 🎨 P1-1: UI/TDS
- [ ] `window.alert()`, `window.confirm()` **미사용**
- [ ] AlertDialog: `title` + `description` + `<AlertButton>` 필수
- [ ] 앱 상단 **자체 헤더 없음** (인앱 브라우저 느낌 방지)
- [ ] Flex Item에 `min-width: 0` 적용
- [ ] 클릭 가능 요소에 `pointer-events: auto` 확인
- [ ] `animation` 사용 시 `@keyframes` 정의 확인
- [ ] Safe Area: `env(safe-area-inset-*)` 적용
- [ ] `prefers-color-scheme: dark` 다크 모드 대응
- [ ] 불필요한 좌우 스크롤 비활성화
- [ ] 확대/축소 핀치줌 비활성화
- [ ] 바텀시트가 닫기 버튼을 가리지 않음
- [ ] 과도한 깜빡임/애니메이션 없음
- [ ] 앱 내 모든 얼럿이 **TDS 모달** 적용

### 🔗 P1-2: 스킨 & 공유
- [ ] 등록된 모든 **기능 스킨 URL 404 없이** 동작
- [ ] 메인 스킨 외 기능 스킨 랜딩 페이지 정상 렌더링
- [ ] `navigator.share()` **미사용** → `getTossShareLink()` + `share()` 사용
- [ ] 공유 메타/앱명이 정보등록 값과 동일

### 📝 P2: 텍스트/브랜딩
- [ ] 앱 이름이 **정보등록과 동일**하게 노출
- [ ] 공유하기, 메타 태그 등에서 **브랜드명 통일**
- [ ] 구독 상품 포함 여부 확인 (구독 오인 워딩 제거)
- [ ] UI 표시 결제 금액과 실제 결제 금액 일치

### 📱 P2: 기기 호환성
- [ ] Safe Area 처리
- [ ] 다크 모드 정상 동작
- [ ] Galaxy Fold 레이아웃 확인

---

## 실기기 테스트 매트릭스

| 시나리오 | iOS | Android | 결과 |
|----------|-----|---------|------|
| 홈/온보딩 백버튼 종료 | [ ] | [ ] | pass/fail |
| 연동 해제 후 재진입 | [ ] | [ ] | pass/fail |
| 공유하기 SDK | [ ] | [ ] | pass/fail |
| AlertDialog 렌더링 | [ ] | [ ] | pass/fail |
| 권한 바텀시트 (거부 후 재진입) | [ ] | [ ] | pass/fail |

---

## 복붙용 최종 점검 프롬프트

```text
앱인토스 미니앱 코드 베이스를 검수 관점으로 점검해줘.
P0 순서대로 결과를 표로 보여줘.

P0-1 네비게이션
- 홈/온보딩(/onboarding 포함)에서 backEvent 시 closeView()로 종료되는가?
- 기능 스킨 진입 시 공통 내비게이션 백버튼/커스텀 버튼이 동작하는가?

P0-2 인증
- getIsTossLoginIntegratedService() 체크가 앱 시작/Auth변경/포그라운드 복귀에 존재하는가?
- isLinked === false 엄격 비교를 사용하는가?
- 연동 해제 시 signOut + 저장소(__convexAuth 포함) + 상태 초기화가 되는가?

P1-1 스킨/공유
- 등록된 기능 스킨이 404 없이 동작하는가?
- navigator.share() 대신 getTossShareLink()+share()를 사용하는가?

P1-2 UI/TDS
- window.alert/confirm 미사용인가?
- AlertDialog title/description/alertButton 필수값이 모두 있는가?
- pointer-events 간섭으로 클릭 불가 요소가 없는가?
```
