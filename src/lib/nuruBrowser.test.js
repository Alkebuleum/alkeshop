// The Nuru dApp browser path: detection, silent reconnect, and connect.
import { afterEach, describe, expect, it } from "vitest";
import { inNuruApp, nuruInjected } from "./nuruBrowser";
import { nuruBrowserConnect } from "./nuru";

const KEY = "0x00000000000000000000000000000000000000C1";
const ACCOUNT = "0x00000000000000000000000000000000000000A1";

// A stand-in for Nuru's injected provider; `approved` = this site is connected in Nuru.
function fakeNuru({ approved }) {
  const calls = [];
  globalThis.window = {
    ethereum: {
      _isNuruWallet: true,
      request: async ({ method }) => {
        calls.push(method);
        if (method === "eth_accounts") return approved ? [KEY] : [];
        if (method === "eth_requestAccounts") return [KEY];
        if (method === "nuru_getIdentity") return { aaWallet: ACCOUNT, ain: "ain-1", primaryHandle: "@amara" };
        throw new Error(method);
      },
    },
  };
  return calls;
}

afterEach(() => { delete globalThis.window; });

describe("the Nuru browser", () => {
  it("is detected from the injected provider", () => {
    expect(nuruInjected()).toBe(null);
    fakeNuru({ approved: false });
    expect(nuruInjected()).toBeTruthy();
    expect(inNuruApp()).toBe(true);
  });

  it("reconnects silently only when the site is already approved", async () => {
    let calls = fakeNuru({ approved: false });
    expect(await nuruBrowserConnect({ silent: true })).toBe(null);
    expect(calls).not.toContain("eth_requestAccounts");

    calls = fakeNuru({ approved: true });
    const c = await nuruBrowserConnect({ silent: true });
    expect(c).toMatchObject({ type: "nuru-browser", address: ACCOUNT, signer: KEY, ain: "AIN-1", handle: "@amara" });
    expect(calls).not.toContain("eth_requestAccounts");
  });

  it("asks Nuru on connect, with the Nuru Account as the address and the key as signer", async () => {
    const calls = fakeNuru({ approved: false });
    const c = await nuruBrowserConnect();
    expect(calls[0]).toBe("eth_requestAccounts");
    expect(c).toMatchObject({ type: "nuru-browser", address: ACCOUNT, signer: KEY });
  });
});
