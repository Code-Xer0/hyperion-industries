import { INQUIRY_EMAIL_TIMEOUT_MS } from "./constants";
import type { EmailMessage, RuntimeDependencies } from "./types";

export async function sendEmailWithTimeout(
  sender: { send(message: EmailMessage): Promise<unknown> },
  message: EmailMessage,
  deps: RuntimeDependencies,
): Promise<void> {
  let timeoutHandle: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = deps.setTimer(() => {
      const error = new Error("timeout");
      error.name = "TimeoutError";
      reject(error);
    }, INQUIRY_EMAIL_TIMEOUT_MS);
  });
  try {
    await Promise.race([sender.send(message), timeout]);
  } finally {
    if (timeoutHandle !== undefined) deps.clearTimer(timeoutHandle);
  }
}
