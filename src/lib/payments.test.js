import { beforeAll, describe, expect, it, vi } from "vitest";
import { ethers } from "ethers";

const TREASURY = "0x1111111111111111111111111111111111111111";
let paidByTx, orderCalldata, amountWei;

beforeAll(async () => {
  vi.stubEnv("VITE_SHOP_TREASURY", TREASURY);
  ({ paidByTx, orderCalldata, amountWei } = await import("./payments"));
});

const EXECUTE = new ethers.Interface(["function execute(address target, uint256 value, bytes data)"]);

describe("payments", () => {
  it("tags a payment with its order id", () => {
    expect(ethers.toUtf8String(orderCalldata("AS-10482"))).toBe("alkeshop:AS-10482");
  });

  it("converts ALKE amounts, including fractions, to wei", () => {
    expect(amountWei(250)).toBe(250n * 10n ** 18n);
    expect(amountWei(0.5)).toBe(5n * 10n ** 17n);
  });

  it("reads a direct transfer to the treasury", () => {
    const tx = { to: TREASURY, value: "0x" + (250n * 10n ** 18n).toString(16), input: orderCalldata("AS-1") };
    expect(paidByTx(tx, "AS-1")).toEqual({ value: 250n * 10n ** 18n, tagged: true });
  });

  it("reads a Nuru Account execute() call to the treasury", () => {
    const input = EXECUTE.encodeFunctionData("execute", [TREASURY, 200n * 10n ** 18n, orderCalldata("AS-2")]);
    const tx = { to: "0x2222222222222222222222222222222222222222", value: "0x0", input };
    expect(paidByTx(tx, "AS-2")).toEqual({ value: 200n * 10n ** 18n, tagged: true });
  });

  it("can't read a relayed call, so it returns null", () => {
    const tx = { to: "0x2222222222222222222222222222222222222222", value: "0x0", input: "0xdeadbeef" };
    expect(paidByTx(tx, "AS-3")).toBeNull();
  });
});
