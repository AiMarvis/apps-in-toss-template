import { AlertDialog } from '@toss/tds-mobile';

interface TdsAlertDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * TDS AlertDialog 래퍼
 *
 * ⚠️ window.alert() / window.confirm() 절대 사용 금지!
 * ⚠️ AlertButton 없이 onClick만 달면 Android에서 작동 안 함!
 *
 * 필수 속성: title + alertButton(<AlertDialog.AlertButton>)
 */
export function TdsAlertDialog({
    open,
    title,
    description,
    confirmText = '확인',
    onConfirm,
    onClose,
}: TdsAlertDialogProps) {
    return (
        <AlertDialog
            open={open}
            title={title}
            description={description}
            alertButton={<AlertDialog.AlertButton onClick={onConfirm}>{confirmText}</AlertDialog.AlertButton>}
            onClose={onClose}
        />
    );
}
