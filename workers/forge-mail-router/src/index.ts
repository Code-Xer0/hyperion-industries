const FORGE_ADDRESS = "forge@hyperion-industries.dev";

export interface Env {
  FORGE_PRIMARY_DESTINATION?: string;
  FORGE_OPERATOR_COPY_DESTINATION?: string;
}

export interface ForgeMailMessage {
  to: string;
  forward(destination: string): Promise<unknown>;
  setReject(reason: string): void;
}

export async function routeForgeMessage(
  message: ForgeMailMessage,
  destinations: { primary: string; operatorCopy: string },
): Promise<void> {
  if (message.to.trim().toLowerCase() !== FORGE_ADDRESS) {
    message.setReject("Unsupported Hyperion mail route.");
    return;
  }

  // Primary delivery is authoritative. If it fails, surface the failure so
  // Cloudflare can report/retry it rather than representing delivery as green.
  await message.forward(destinations.primary);

  // Do not throw after primary delivery: retrying the whole invocation could
  // duplicate Keshawn's copy. The operator copy is metadata-only observable.
  try {
    await message.forward(destinations.operatorCopy);
  } catch {
    console.error(JSON.stringify({ event: "forge_mail_operator_copy_failed" }));
  }
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const primary = env.FORGE_PRIMARY_DESTINATION?.trim();
    const operatorCopy = env.FORGE_OPERATOR_COPY_DESTINATION?.trim();
    if (!primary || !operatorCopy) {
      message.setReject("Forge routing is temporarily unavailable.");
      console.error(JSON.stringify({ event: "forge_mail_configuration_required" }));
      return;
    }
    await routeForgeMessage(message, { primary, operatorCopy });
  },
};
