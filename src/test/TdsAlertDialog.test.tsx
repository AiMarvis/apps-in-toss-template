/**
 * TdsAlertDialog 컴포넌트 테스트
 *
 * TDS AlertDialog 래퍼가 반려 방지 필수 Props(title, description, alertButton)를
 * 올바르게 전달하는지 검증합니다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TdsAlertDialog } from '../components/TdsAlertDialog';

// @toss/tds-mobile mock
vi.mock('@toss/tds-mobile', () => ({
  AlertDialog: ({ open, title, description, children }: {
    open: boolean;
    title: string;
    description: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="alert-dialog" role="alertdialog">
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    ) : null,
  AlertButton: ({ children, onClick }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="alert-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('TdsAlertDialog', () => {
  it('open=true일 때 title과 description이 렌더링된다', () => {
    render(
      <TdsAlertDialog
        open={true}
        onClose={() => {}}
        title="테스트 제목"
        description="테스트 설명"
      />
    );

    expect(screen.getByText('테스트 제목')).toBeInTheDocument();
    expect(screen.getByText('테스트 설명')).toBeInTheDocument();
  });

  it('open=false일 때 다이얼로그가 렌더링되지 않는다', () => {
    render(
      <TdsAlertDialog
        open={false}
        onClose={() => {}}
        title="제목"
        description="설명"
      />
    );

    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });

  it('확인 버튼 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn();

    render(
      <TdsAlertDialog
        open={true}
        onClose={onClose}
        title="확인"
        description="닫기 테스트"
      />
    );

    fireEvent.click(screen.getByTestId('alert-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
