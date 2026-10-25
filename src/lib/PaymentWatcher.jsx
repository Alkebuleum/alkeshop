// Keeps checking every submitted payment until it confirms or fails, on
// whatever page the buyer is on ("You can leave this page").
import { useEffect } from "react";
import { getState, useStore, paymentStage, paymentConfirmed, paymentFailed, tick } from "./store";
import { checkPayment } from "./payments";

const POLL_MS = 3000;
const DROPPED_AFTER_MS = 15 * 60 * 1000; // never seen on chain: the wallet didn't really send it

export default function PaymentWatcher() {
  const s = useStore();
  const watching = s.orders.filter((o) => o.status === "confirming").map((o) => o.id).join(",");

  useEffect(() => {
    const t = setInterval(tick, POLL_MS);
    tick();
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!watching) return;
    let live = true;
    const check = async () => {
      for (const id of watching.split(",")) {
        const o = getState().orders.find((x) => x.id === id);
        if (!o || o.status !== "confirming") continue;
        try {
          const r = await checkPayment(o);
          if (!live) return;
          if (r.stage === "confirmed") paymentConfirmed(id, r);
          else if (r.stage === "failed") paymentFailed(id, "failed");
          else if (r.stage === "underpaid") paymentFailed(id, "underpaid", { received: r.received });
          else if (r.stage === "sent" && Date.now() - o.payment.submittedAt > DROPPED_AFTER_MS) paymentFailed(id, "failed");
          else paymentStage(id, r.stage, { confirmations: r.confirmations });
        } catch {
          // RPC hiccup: try again on the next round.
        }
      }
    };
    check();
    const t = setInterval(check, POLL_MS);
    return () => { live = false; clearInterval(t); };
  }, [watching]);

  return null;
}
