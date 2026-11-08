import { Image } from "expo-image";

/**
 * Preload all face images before starting the Memorize countdown;
 * resolves once all images have loaded or errored out, with a max safety timeout.
 */
export const preloadImages = (urls: string[], timeoutMs = 4000): Promise<void> => {
  if (!urls || urls.length === 0) return Promise.resolve();

  const load = Image.prefetch(urls).then(() => undefined, () => undefined);
  // Safety timeout so user is never stuck indefinitely on slow or blocked connections
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));

  return Promise.race([load, timeout]);
};
