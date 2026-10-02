"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type State = "checking" | "unsupported" | "prompt" | "on" | "off";

export function PushOptIn({ vapidKey }: { vapidKey: string | null }) {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      // Yield once so no setState runs synchronously inside the effect.
      await Promise.resolve();
      if (
        !vapidKey ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) setState("unsupported");
        return;
      }
      try {
        await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;
        setState(
          Notification.permission === "granted"
            ? "on"
            : Notification.permission === "denied"
              ? "off"
              : "prompt",
        );
      } catch {
        if (!cancelled) setState("unsupported");
      }
    };
    void detect();
    return () => {
      cancelled = true;
    };
  }, [vapidKey]);

  if (state !== "prompt") return null;

  return (
    <div className="card animate-rise flex items-center gap-3 px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">Get the evening nudge</p>
        <p className="text-xs leading-relaxed text-ink-soft">
          One quiet notification at your reminder time when the day is still
          open. That is the whole trick.
        </p>
      </div>
      <button
        type="button"
        className="btn btn-primary shrink-0 px-4 py-2"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              setState("off");
              return;
            }
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey!),
            });
            const json = sub.toJSON();
            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(json),
            });
            setState("on");
          } catch {
            setState("off");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "..." : "Enable"}
      </button>
    </div>
  );
}
