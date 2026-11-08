import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { guestNumbersApi } from './guestNumbers.api';
import type { ApiSuccessResponse } from '@/types/auth.types';
import type { NumberAnswers, NumberProgress, NumberSession, NumberSettings } from '../types/numberTypes';

const root = '/numbers';
const isGuest = () => !useAuthStore.getState().isAuthenticated;
useAuthStore.subscribe((state, previous) => {
    if (state.user?._id !== previous.user?._id) guestNumbersApi.clear();
});
const sessionPath = (id: string) => `${root}/sessions/${encodeURIComponent(id)}`;
const sessionData = async (request: Promise<unknown>): Promise<NumberSession> => {
    const response = await request as ApiSuccessResponse<NumberSession>;
    return response.data;
};
export const numbersApi = {
    create: (settings: NumberSettings) => isGuest() ? guestNumbersApi.create(settings) : sessionData(apiClient.post(`${root}/sessions`, settings)),
    get: (id: string) => isGuest() ? guestNumbersApi.get(id) : sessionData(apiClient.get(sessionPath(id))),
    recall: (id: string) => isGuest() ? guestNumbersApi.recall(id) : sessionData(apiClient.post(`${sessionPath(id)}/recall`)),
    ready: (id: string) => isGuest() ? guestNumbersApi.ready(id) : sessionData(apiClient.post(`${sessionPath(id)}/recall/ready`)),
    save: (id: string, revision: number, answers: NumberAnswers) =>
        isGuest() ? guestNumbersApi.save(id, revision, answers) : sessionData(apiClient.put(`${sessionPath(id)}/answers`, { revision, answers })),
    submit: (id: string, revision: number, answers: NumberAnswers) =>
        isGuest() ? guestNumbersApi.submit(id, revision, answers) : sessionData(apiClient.post(`${sessionPath(id)}/submit`, { revision, answers })),
    progress: async (): Promise<NumberProgress> => {
        if (isGuest()) return guestNumbersApi.progress();
        const response = await apiClient.get(`${root}/progress`) as unknown as ApiSuccessResponse<NumberProgress>;
        return response.data;
    },
};
