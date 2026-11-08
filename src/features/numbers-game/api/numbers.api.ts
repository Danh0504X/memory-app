import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/types/auth.types';
import type { NumberAnswers, NumberProgress, NumberSession, NumberSettings } from '../types/numberTypes';

const root = '/numbers';
const sessionPath = (id: string) => `${root}/sessions/${encodeURIComponent(id)}`;
const sessionData = async (request: Promise<unknown>): Promise<NumberSession> => {
    const response = await request as ApiSuccessResponse<NumberSession>;
    return response.data;
};
export const numbersApi = {
    create: (settings: NumberSettings) => sessionData(apiClient.post(`${root}/sessions`, settings)),
    get: (id: string) => sessionData(apiClient.get(sessionPath(id))),
    recall: (id: string) => sessionData(apiClient.post(`${sessionPath(id)}/recall`)),
    ready: (id: string) => sessionData(apiClient.post(`${sessionPath(id)}/recall/ready`)),
    save: (id: string, revision: number, answers: NumberAnswers) =>
        sessionData(apiClient.put(`${sessionPath(id)}/answers`, { revision, answers })),
    submit: (id: string, revision: number, answers: NumberAnswers) =>
        sessionData(apiClient.post(`${sessionPath(id)}/submit`, { revision, answers })),
    progress: async (): Promise<NumberProgress> => {
        const response = await apiClient.get(`${root}/progress`) as unknown as ApiSuccessResponse<NumberProgress>;
        return response.data;
    },
};
