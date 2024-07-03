import { expect, describe, it } from "vitest";
import { expandValues } from "./utils";
describe("Utils", () => {
  it("should return correct string when maxVals is 3 and extendSize is 1", () => {
    const result = expandValues(3, 1);
    expect(result).toBe("($1,$2,$3)");
  });

  it("should return empty string when maxVals is 0", () => {
    const result = expandValues(0);
    expect(result).toBe("");
  });

  it("should return correct string for maxVals=2 and extendSize=2", () => {
    const result = expandValues(2, 2);
    expect(result).toBe("($1,$2),($3,$4)");
  });
});
