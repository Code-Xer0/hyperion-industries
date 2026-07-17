import { describe, expect, it, vi } from "vitest";
import { routeForgeMessage } from "../src/index";

describe("Forge inbound mail routing", () => {
  it("delivers to the primary owner before the operator copy", async () => {
    const forward = vi.fn(async (_destination: string) => undefined);
    const setReject = vi.fn();

    await routeForgeMessage(
      { to: "Forge@Hyperion-Industries.dev", forward, setReject },
      { primary: "primary@example.net", operatorCopy: "operator@example.com" },
    );

    expect(forward.mock.calls.map(([destination]) => destination)).toEqual([
      "primary@example.net",
      "operator@example.com",
    ]);
    expect(setReject).not.toHaveBeenCalled();
  });

  it("rejects any recipient outside the exact Forge route", async () => {
    const forward = vi.fn(async (_destination: string) => undefined);
    const setReject = vi.fn();

    await routeForgeMessage(
      { to: "hello@hyperion-industries.dev", forward, setReject },
      { primary: "primary@example.net", operatorCopy: "operator@example.com" },
    );

    expect(forward).not.toHaveBeenCalled();
    expect(setReject).toHaveBeenCalledWith("Unsupported Hyperion mail route.");
  });

  it("does not duplicate primary delivery when the operator copy fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const forward = vi.fn(async (destination: string) => {
      if (destination === "operator@example.com") throw new Error("copy failed");
    });

    await expect(routeForgeMessage(
      { to: "forge@hyperion-industries.dev", forward, setReject: vi.fn() },
      { primary: "primary@example.net", operatorCopy: "operator@example.com" },
    )).resolves.toBeUndefined();
    expect(forward).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith('{"event":"forge_mail_operator_copy_failed"}');
  });

  it("surfaces a primary delivery failure", async () => {
    const forward = vi.fn(async () => { throw new Error("primary failed"); });

    await expect(routeForgeMessage(
      { to: "forge@hyperion-industries.dev", forward, setReject: vi.fn() },
      { primary: "primary@example.net", operatorCopy: "operator@example.com" },
    )).rejects.toThrow("primary failed");
    expect(forward).toHaveBeenCalledTimes(1);
  });
});
