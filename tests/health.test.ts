import { describe, expect, it } from "vitest";
import { health } from "../src/domain/health";

describe("health", () => {
  it("responde ok", () => {
    expect(health()).toEqual({ status: "ok" });
  });
});
