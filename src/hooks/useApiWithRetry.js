import { useState, useCallback } from 'react';

export const useApiWithRetry = (apiFunc, maxRetries = 3) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await apiFunc(...args);
        setData(result.data);
        setLoading(false);
        return result.data;
      } catch (err) {
        lastError = err;

        // Don't retry on client errors (4xx)
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    setError(lastError);
    setLoading(false);
    throw lastError;
  }, [apiFunc, maxRetries]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
};
