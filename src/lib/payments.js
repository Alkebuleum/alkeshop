// Building an order's payment. Each payment is an ALKE transfer to
// SHOP_TREASURY whose calldata is "alkeshop:<order id>", so the server can
// match it to the order (functions/src/payments.js checks it on chain).
import { ethers } from "ethers";
import { WEI } from "./payPlan";

export const orderCalldata = (orderId) => ethers.hexlify(ethers.toUtf8Bytes(`alkeshop:${orderId}`));
export const amountWei = (alke) => BigInt(Math.round(alke * 1000)) * (WEI / 1000n);
