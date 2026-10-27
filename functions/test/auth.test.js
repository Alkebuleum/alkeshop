const test = require("node:test");
const assert = require("node:assert");
const { ethers } = require("ethers");
const { buildMessage, verifySignIn } = require("../src/auth");

const key = ethers.Wallet.createRandom();
const other = ethers.Wallet.createRandom();
const nuruAccount = ethers.Wallet.createRandom().address; // stands in for a contract
const now = Date.parse("2026-10-27T12:00:00Z");
const issuedAt = new Date(now).toISOString();

const sign = (w, wallet, k = w.address, at = issuedAt) => w.signMessage(buildMessage({ wallet, key: k, issuedAt: at }));

test("a plain wallet signs for itself", async () => {
  const signature = await sign(key, key.address);
  assert.equal(await verifySignIn({ wallet: key.address, key: key.address, issuedAt, signature }, { now }), key.address.toLowerCase());
});

test("a Nuru key signs for its Nuru Account when the account vouches for it", async () => {
  const signature = await sign(key, nuruAccount);
  const isKeyOf = async (w, k) => w === nuruAccount && k === key.address;
  assert.equal(await verifySignIn({ wallet: nuruAccount, key: key.address, issuedAt, signature }, { now, isKeyOf }), nuruAccount.toLowerCase());
  await assert.rejects(verifySignIn({ wallet: nuruAccount, key: key.address, issuedAt, signature }, { now, isKeyOf: async () => false }), /can't sign for that wallet/);
});

test("rejects a signature from a different key", async () => {
  const signature = await sign(other, key.address, key.address);
  await assert.rejects(verifySignIn({ wallet: key.address, key: key.address, issuedAt, signature }, { now }), /wasn't made by this key/);
});

test("rejects an old sign-in request", async () => {
  const at = new Date(now - 10 * 60 * 1000).toISOString();
  const signature = await sign(key, key.address, key.address, at);
  await assert.rejects(verifySignIn({ wallet: key.address, key: key.address, issuedAt: at, signature }, { now }), /expired/);
});

test("rejects a signature over a different wallet", async () => {
  const signature = await sign(key, key.address);
  await assert.rejects(verifySignIn({ wallet: other.address, key: key.address, issuedAt, signature }, { now, isKeyOf: async () => false }));
});
