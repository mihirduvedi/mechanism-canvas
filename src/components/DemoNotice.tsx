import { useState } from "react";
import { JUDGE_AGENT_PROMPT } from "../demo/judge-prompt";

type CopyStatus = "idle" | "copied" | "failed";

export function DemoNotice() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(JUDGE_AGENT_PROMPT);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <section className="demo-notice" aria-label="Demo session status">
      <div>
        <strong>Clean demo</strong>
        <span>Refresh whenever you like. Saved practice stays separate.</span>
      </div>
      <button type="button" onClick={copyPrompt}>
        {copyStatus === "copied" ? "Judge prompt copied" : "Copy judge prompt"}
      </button>
      {copyStatus === "failed" && (
        <span className="demo-notice__error" role="status">
          Clipboard access is unavailable. The prompt is also in the judge guide.
        </span>
      )}
    </section>
  );
}
