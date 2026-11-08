import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Request } from '../hooks/useOverview';

interface BlockStateProps<T> {
    request: Request<T>;
    onRetry: () => void;
    children: (data: T) => ReactNode;
}

// Trạng thái tải / lỗi của một khối; khung khối giữ nguyên để trang không nhảy bố cục
export const BlockState = <T,>({ request, onRetry, children }: BlockStateProps<T>) => {
    if (request.status === 'loading') return <p className="dash-note">Đang tải…</p>;
    if (request.status === 'error') {
        return (
            <div className="dash-note dash-note--error" role="alert">
                <p>{request.message}</p>
                <button type="button" className="dash-link" onClick={onRetry}>
                    <RefreshCw size={14} aria-hidden="true" />
                    Thử lại
                </button>
            </div>
        );
    }
    return <>{children(request.data)}</>;
};
