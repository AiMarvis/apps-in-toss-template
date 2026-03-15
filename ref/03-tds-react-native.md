# TDS React Native 컴포넌트 레퍼런스

> **원본**: https://tossmini-docs.toss.im/tds-react-native/llms-full.txt
> **생성일**: 2026-03-06

---

## 시작하기

```bash
# 1. 필수 패키지 설치
npm install @toss/tds-react-native

# 2. Provider 설정 (App.tsx)
import { TDSProvider } from '@toss/tds-react-native';
<TDSProvider>
  <App />
</TDSProvider>
```

---

## 컴포넌트 목록

### 레이아웃 & 구조
| 컴포넌트 | 설명 |
|----------|------|
| `List` | 목록 컨테이너 |
| `ListRow` | 목록 행 (아이콘, 화살표, 다중 줄 등) |
| `ListHeader` | 목록 헤더 (제목, 화살표) |
| `ListFooter` | 목록 푸터 (텍스트, 아이콘) |
| `GridList` | 그리드 목록 |
| `BoardRow` | 보드 행 |
| `TableRow` | 테이블 행 |
| `Post` | 게시물 (제목, 본문, 목록, 구분선) |
| `Carousel` | 캐러셀 (이미지, 카드, 인디케이터) |
| `Border` | 구분선 |

### 입력 & 폼
| 컴포넌트 | 설명 |
|----------|------|
| `TextField` | 텍스트 입력 (라벨, 에러, 포맷팅) |
| `SearchField` | 검색 입력 (클리어 버튼) |
| `Checkbox` | 체크박스 |
| `Radio` | 라디오 버튼 |
| `Switch` | 토글 스위치 |
| `Slider` | 슬라이더 (범위, 간격) |
| `NumberKeypad` | 숫자 키패드 (금액, PIN) |
| `NumericSpinner` | 숫자 스피너 |
| `Rating` | 별점 |
| `Dropdown` | 드롭다운 메뉴 |

### 버튼 & 액션
| 컴포넌트 | 설명 |
|----------|------|
| `Button` | 범용 버튼 (크기, 스타일, 로딩, 비활성화) |
| `IconButton` | 아이콘 버튼 |
| `TextButton` | 텍스트 버튼 |

### 피드백 & 알림
| 컴포넌트 | 설명 |
|----------|------|
| `Dialog` | ⭐ **AlertDialog** / ConfirmDialog (필수!) |
| `Toast` | 토스트 메시지 |
| `Loader` | 로딩 인디케이터 |
| `Skeleton` | 스켈레톤 로딩 |
| `ProgressBar` | 진행률 바 |
| `Result` | 결과 화면 |
| `ErrorPage` | 에러 페이지 (404, 500 등) |

### 내비게이션 & 탭
| 컴포넌트 | 설명 |
|----------|------|
| `Navbar` | 내비게이션 바 |
| `Tab` | 탭 (스크롤, 상태) |
| `SegmentedControl` | 세그먼트 컨트롤 |
| `Stepper` | 스테퍼 (단계 표시) |

### 시각 & 데코
| 컴포넌트 | 설명 |
|----------|------|
| `Badge` | 배지 (크기, 스타일) |
| `Asset` | 에셋 (이미지, 아이콘, Lottie) |
| `Highlight` | 하이라이트 (온보딩 튜토리얼) |
| `Shadow` | 그림자 |
| `Gradient` | 그라데이션 (Linear, Radial) |
| `BarChart` | 막대 차트 |

### 기타
| 컴포넌트 | 설명 |
|----------|------|
| `AmountTop` | 금액 표시 (송금, 계좌 잔액) |
| `BottomInfo` | 하단 정보 |
| `Colors` | 색상 팔레트 (기본, 배경) |
| `Typography` | 타이포그래피 규칙 |

---

## ⭐ 검수 핵심: AlertDialog 사용법

```tsx
import { AlertDialog, AlertButton } from '@toss/tds-react-native';

// ✅ 올바른 사용 — title + description + AlertButton 필수
<AlertDialog
  open={isOpen}
  onClose={handleClose}
  title="알림 제목"           // 필수!
  description="알림 내용"     // 권장
>
  <AlertButton onClick={handleConfirm}>확인</AlertButton>  // 필수!
</AlertDialog>

// ❌ 금지: window.alert(), window.confirm()
// ❌ 금지: AlertButton 없이 onClick만 사용 (Android 작동 안 함)
```
