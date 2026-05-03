import { describe, it, expect } from "vitest";

describe("NEO Bridge secrets", () => {
  it("NEO_BRIDGE_URL is set", () => {
    expect(process.env.NEO_BRIDGE_URL).toBeTruthy();
    expect(process.env.NEO_BRIDGE_URL).toContain("railway.app");
  });

  it("NEO_BRIDGE_API_KEY is set", () => {
    expect(process.env.NEO_BRIDGE_API_KEY).toBeTruthy();
    expect(process.env.NEO_BRIDGE_API_KEY!.length).toBeGreaterThan(5);
  });
});
