// While one of this wallet's payments is confirming, asks the server to check
// it every few seconds so the order updates promptly. The server also checks
// every minute on its own, so leaving the site doesn't lose a payment.
import { useEffect } from "react";
import { useStore, checkPayment } from "./store";

const POLL_MS = 4000;

export default function PaymentWatcher() {
  const s = useStore();
  const me = s.session?.wallet;
  const watching = s.orders.filter((o) => o.status === "confirming" && o.buyer === me).map((o) => o.id).join(",");

  useEffect(() => {
    if (!watching) return;
    const check = () => watching.split(",").forEach(checkPayment);
    check();
    const t = setInterval(check, POLL_MS);
    return () => clearInterval(t);
  }, [watching]);

  return null;
}
