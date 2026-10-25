import { describe, expect, it } from "vitest";
import { planPayment, SIGNER_GAS_BUFFER, WEI } from "./payPlan";

const ACCOUNT = "0x00000000000000000000000000000000000000aa";
const SIGNER = "0x00000000000000000000000000000000000000bb";
const nuru = { type: "nuru", address: ACCOUNT, signer: SIGNER };
// primary() returns the signer, left-padded to 32 bytes.
const primaryIsSigner = async () => "0x" + "0".repeat(24) + SIGNER.slice(2);
const primaryIsOther = async () => "0x" + "0".repeat(24) + "cc".repeat(20);
const balances = (account, signer) => async (a) => (a === ACCOUNT ? account : signer);

describe("planPayment", () => {
  it("pays from the Nuru Account when it covers the price", async () => {
    const p = await planPayment(nuru, 250n * WEI, { getBalance: balances(300n * WEI, WEI), getPrimary: primaryIsSigner });
    expect(p.mode).toBe("account");
  });

  it("moves the shortfall from the signer key first when that covers it", async () => {
    const p = await planPayment(nuru, 250n * WEI, { getBalance: balances(200n * WEI, 100n * WEI), getPrimary: primaryIsSigner });
    expect(p.mode).toBe("consolidate");
    expect(p.topUp).toBe(50n * WEI);
  });

  it("is short, by the right amount, when both together can't cover it", async () => {
    const p = await planPayment(nuru, 250n * WEI, { getBalance: balances(200n * WEI, 10n * WEI), getPrimary: primaryIsSigner });
    expect(p.mode).toBe("short");
    expect(p.shortBy).toBe(40n * WEI + SIGNER_GAS_BUFFER);
  });

  it("is short when the primary key has no ALKE for gas", async () => {
    const p = await planPayment(nuru, 250n * WEI, { getBalance: balances(300n * WEI, 0n), getPrimary: primaryIsSigner });
    expect(p.mode).toBe("short");
    expect(p.gasKeyEmpty).toBe(true);
  });

  it("lets a linked key pay without gas (the relay pays it)", async () => {
    const p = await planPayment(nuru, 250n * WEI, { getBalance: balances(300n * WEI, 0n), getPrimary: primaryIsOther });
    expect(p.mode).toBe("account");
  });

  it("handles a plain browser wallet", async () => {
    const c = { type: "injected", address: ACCOUNT };
    expect((await planPayment(c, 5n * WEI, { getBalance: async () => 10n * WEI })).mode).toBe("wallet");
    const short = await planPayment(c, 5n * WEI, { getBalance: async () => 2n * WEI });
    expect(short.mode).toBe("short");
    expect(short.shortBy).toBe(3n * WEI);
  });
});
