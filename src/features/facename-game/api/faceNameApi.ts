import { apiClient } from "@/lib/api-client";
import type { LevelConfig, Person, RoundSubmissionResult } from "../types";

export interface CreateRoundResponse {
  roundId: string;
  mode: "level" | "free";
  levelId?: number;
  settings: {
    faceCount: number;
    memorizeSeconds: number;
    recallSeconds: number;
  };
  people: Person[];
}

export const fetchLevels = async (): Promise<LevelConfig[]> => {
  const res = (await apiClient.get("/game/levels")) as unknown as {
    status: string;
    levels: LevelConfig[];
  };
  return res.levels;
};

export const startLevelRound = async (levelId: number): Promise<CreateRoundResponse> => {
  const res = (await apiClient.post("/game/rounds", {
    mode: "level",
    levelId,
  })) as unknown as CreateRoundResponse;
  return res;
};

export const startFreeRound = async (
  faceCount: number,
  memorizeSeconds: number,
  recallSeconds: number,
): Promise<CreateRoundResponse> => {
  const res = (await apiClient.post("/game/rounds", {
    mode: "free",
    faceCount,
    memorizeSeconds,
    recallSeconds,
  })) as unknown as CreateRoundResponse;
  return res;
};

export const submitFaceNameRound = async (
  roundId: string,
  answers: Array<{ personId: number; answer: string }>,
  timeUsedSeconds: number,
): Promise<RoundSubmissionResult> => {
  const res = (await apiClient.post(`/game/rounds/${roundId}/submit`, {
    answers,
    timeUsedSeconds,
  })) as unknown as RoundSubmissionResult;
  return res;
};

