"use client";

import { useEffect, useState } from "react";
import { isIOS, isStandalone } from "@/lib/native";
import { Modal, ghostBtn } from "./Modal";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallButton({ className }: { className: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIOS());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={async () => {
          if (!prompt) {
            setHelp(true);
            return;
          }
          await prompt.prompt();
          await prompt.userChoice;
          setPrompt(null);
        }}
      >
        Install app
      </button>
      {help ? (
        <Modal title="Install TaskOrb" onClose={() => setHelp(false)}>
          <ol className="grid gap-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <Step n={1} />
              <span className="flex items-center gap-1.5">
                Tap <ShareIcon /> Share in the browser toolbar.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Step n={2} />
              Scroll and choose “Add to Home Screen”.
            </li>
            <li className="flex items-center gap-3">
              <Step n={3} />
              Tap Add, then open TaskOrb from your Home Screen.
            </li>
          </ol>
          <p className="mt-4 text-xs text-white/50">
            It opens full screen like an app, and can send you notifications when someone assigns you a task.
          </p>
          <div className="mt-5 flex justify-end">
            <button type="button" className={ghostBtn} onClick={() => setHelp(false)}>
              Got it
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4d84ff]/25 text-xs font-semibold text-[#9cc0ff]">
      {n}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9cc0ff" strokeWidth="2" aria-hidden>
      <path d="M12 3v12M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
    </svg>
  );
}
