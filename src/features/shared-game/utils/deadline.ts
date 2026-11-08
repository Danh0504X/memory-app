// Convert once when a response arrives; retries keep the server's remaining time instead of restarting the timer.
export const clientDeadline = (deadline: string, serverNow?: string): number => serverNow
    ? Date.now() + Math.max(0, Date.parse(deadline) - Date.parse(serverNow))
    : Date.parse(deadline);
