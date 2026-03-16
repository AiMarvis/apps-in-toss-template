# SDK 단일 기능 예제 템플릿

> `with-*` 예제를 새로 만들 때 이 디렉토리를 복사하여 시작합니다.

## 구조

```
with-{feature}/
├── README.md           # 기능 설명, 사용법, API 레퍼런스 링크
├── src/
│   ├── hooks/
│   │   └── use{Feature}.ts   # SDK 래핑 훅 (Safety Pattern 필수)
│   └── components/
│       └── {Feature}Demo.tsx  # 데모 컴포넌트
└── package.json         # 독립 의존성 (다른 예제와 import 금지)
```

## 필수 패턴

```typescript
// hooks/use{Feature}.ts
import { useState, useEffect } from 'react';
import type { UseFeatureReturn } from '../../src/hooks/useFeatureBase';

export function use{Feature}(): UseFeatureReturn & { /* 기능별 반환값 */ } {
  const [status, setStatus] = useState<UseFeatureReturn['status']>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [environment, setEnvironment] = useState<UseFeatureReturn['environment']>('web');

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    (async () => {
      setStatus('loading');
      try {
        // Step 1: Dynamic import
        const { someAPI } = await import('@apps-in-toss/web-framework');

        // Step 2: isSupported 체크
        if (someAPI.isSupported?.() !== true) {
          setIsSupported(false);
          setStatus('ready'); // mock 동작 제공
          return;
        }

        setIsSupported(true);

        // Step 3: cleanup 패턴
        cleanup = someAPI({
          onEvent: (e: unknown) => { /* 이벤트 처리 */ },
          onError: (e: unknown) => { setError(e as Error); setStatus('error'); },
        });

        setStatus('ready');
      } catch (err) {
        setError(err as Error);
        setStatus('error');
      }
    })();

    return () => { cleanup?.(); };
  }, []);

  return { status, error, isSupported, environment };
}
```

## 네이밍 규칙

| 대상 | 패턴 | 예시 |
|------|------|------|
| 디렉토리 | `with-{feature}` | `with-rewarded-ad` |
| 훅 | `use{Feature}.ts` | `useRewardedAd.ts` |
| 컴포넌트 | `{Feature}Demo.tsx` | `RewardedAdDemo.tsx` |

## 주의사항

- 각 예제는 **독립적** — 다른 예제의 코드를 import하지 않음
- 웹 환경에서도 동작하는 **mock 동작을 반드시 제공**
- `granite.config.ts`의 `appName`은 디렉토리명과 일치시킴
