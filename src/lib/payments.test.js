import { describe, it, expect } from "vitest";
import { amountWei, orderCalldata } from "./payments";

describe("payment building", () => {
  it("tags the transfer with the order id", () => {
    expect(orderCalldata("AS-10501")).toBe("0x" + Buffer.from("alkeshop:AS-10501").toString("hex"));
  });
  it("converts ALKE to wei to the thousandth", () => {
    expect(amountWei(1)).toBe(10n ** 18n);
    expect(amountWei(0.125)).toBe(125n * 10n ** 15n);
  });
});
