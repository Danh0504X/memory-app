import type { ImageCard } from "../types/imageTypes";

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const IMAGES_LEVEL_IMAGE_COUNTS: Record<number, number> = {
  1: 6,
  2: 8,
  3: 10,
  4: 12,
  5: 14,
  6: 16,
  7: 18,
  8: 22,
  9: 26,
  10: 30,
};

export const getImageCountForLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.min(10, level));
  return IMAGES_LEVEL_IMAGE_COUNTS[safeLevel] ?? 6;
};

export const generateImageDeck = (count: number): ImageCard[] => {
  const gameSession = Math.random().toString(36).substring(2, 9);

  fetch("https://picsum.photos/seed/1/400/400")
    .then((response) => {
      console.log("ABC Fetching image for seed 1, response:", response);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      console.log("URL response:", response.url);
      return response.blob();
    })
    .then((blob) => {
      const imageUrl = URL.createObjectURL(blob);
      console.log("ABC Fetched image URL:", imageUrl);
    })
    .catch((error) => {
      console.error("Error fetching image:", error);
    });

  return Array.from({ length: count }, (_, index) => {
    const seed = `memio_${gameSession}_${index}`;
    return {
      id: `img-${seed}`,
      imageUrl: `https://picsum.photos/seed/${seed}/400/400`,
    };
  });
};
