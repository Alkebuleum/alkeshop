// One message at a time from the store (usually why an action failed).
import React, { useEffect } from "react";
import { useStore, dismissToast } from "../lib/store";
import { Icon } from "./ui";

export default function Toast() {
  const { toast } = useStore();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 6000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div role="alert" className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-start gap-3 rounded-[14px] border border-bad/40 bg-surface px-4 py-3 text-sm text-ink shadow-2xl md:bottom-8">
      <Icon name="alert" size={18} className="mt-0.5 flex-none text-bad" />
      <span className="flex-1">{toast.text}</span>
      <button type="button" onClick={dismissToast} aria-label="Dismiss" className="-m-1 flex h-8 w-8 items-center justify-center rounded-full text-mute hover:text-ink"><Icon name="close" size={16} /></button>
    </div>
  );
}
