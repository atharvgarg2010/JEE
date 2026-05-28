import { ApiError } from "./error";

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 10000 // default 10 seconds
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ApiError(504, "Request Timeout"));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
