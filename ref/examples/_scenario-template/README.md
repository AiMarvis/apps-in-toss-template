# 풀스택 시나리오 예제 템플릿

> `scenario-*` 시나리오를 새로 만들 때 이 디렉토리를 복사하여 시작합니다.

## 구조

```
scenario-{name}/
├── README.md              # 시나리오 설명, 조합 블록 목록
├── client/                # 프론트엔드
│   ├── src/
│   │   ├── App.tsx
│   │   ├── hooks/         # SDK + 서버 연동 훅
│   │   ├── components/    # UI 컴포넌트
│   │   └── pages/         # 페이지
│   ├── package.json
│   └── vite.config.ts
├── server/                # 백엔드 (Convex 사용 시 convex/ 디렉토리)
│   ├── convex/
│   │   ├── schema.ts
│   │   └── functions.ts
│   └── package.json
└── package.json           # 루트 (scripts: install:all, dev)
```

## 시나리오 설계 원칙

1. **조합 블록 명시**: README에 어떤 `with-*` 블록을 조합했는지 명시
2. **서버 선택**: Convex(기본), Express+SQLite, Supabase 중 선택
3. **독립 실행**: `npm run install:all && npm run dev`로 즉시 실행 가능
4. **실제 비즈니스 패턴**: 출석체크, 미션, 공유 리워드 등 실제 사용 시나리오 구현

## 기존 시나리오 참고

| 시나리오 | 조합 블록 |
|----------|----------|
| `scenario-attendance-reward` | login + storage + rewarded-ad + promotion |
| `scenario-lottery-reward` | rewarded-ad + promotion |
| `scenario-mission-system` | storage + promotion |
| `scenario-share-viral` | contacts-viral + storage |
| `scenario-milestone-withdraw` | storage + promotion |
| `scenario-onboarding-coach` | storage + env-detection |

## 루트 package.json 예시

```json
{
  "name": "scenario-{name}",
  "scripts": {
    "install:all": "cd client && npm install && cd ../server && npm install",
    "dev": "concurrently \"cd client && npm run dev\" \"cd server && npm run dev\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev"
  }
}
```
