// Lỗi đã được api-client chuẩn hoá thành { status, code, message }; status 0 là mất kết nối
interface NormalizedApiError {
    status?: number;
    message?: string;
}

export type RoundAction = "start" | "recall" | "submit";

const FALLBACK_MESSAGES: Record<RoundAction, string> = {
    start: "Không thể bắt đầu ván chơi. Vui lòng thử lại.",
    recall: "Không thể chuyển sang phần nhớ lại. Vui lòng thử lại.",
    submit: "Không thể nộp bài. Vui lòng thử lại.",
};

// 409: ván đã quá thời gian hoặc không còn ở đúng phase, không thể chơi tiếp
export const isRoundClosed = (error: unknown) => (error as NormalizedApiError | null)?.status === 409;

// Thông báo tiếng Việt cho người chơi; message của backend là tiếng Anh nên không hiện trực tiếp
export const describeRoundError = (error: unknown, action: RoundAction): string => {
    const { status, message } = (error as NormalizedApiError | null) ?? {};
    if (status === 0 && message) return message;
    if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (status === 403) return "Cấp độ này chưa được mở khoá.";
    if (status === 409) return "Ván chơi đã quá thời gian nên không được tính. Hãy bắt đầu ván mới nhé.";
    return FALLBACK_MESSAGES[action];
};
