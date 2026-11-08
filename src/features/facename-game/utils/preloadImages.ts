/**
 * Preload all face images before starting the Memorize countdown;
 * resolves once all images have loaded or errored out, with a max safety timeout.
 */
export const preloadImages = (urls: string[], timeoutMs = 4000): Promise<void> => {
  return new Promise((resolve) => {
    if (!urls || urls.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const total = urls.length;
    let isSettled = false;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= total && !isSettled) {
        isSettled = true;
        resolve();
      }
    };

    urls.forEach((url) => {
      const img = new Image();
      img.onload = checkComplete;
      img.onerror = checkComplete;
      img.src = url;
    });

    // Safety timeout so user is never stuck indefinitely on slow or blocked connections
    setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        resolve();
      }
    }, timeoutMs);
  });
};

