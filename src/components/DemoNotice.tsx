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
        <span>Starts in Coach with no lab, delegation, or receipts. Open a two-path Counterfactual Lab, then start a six-action Compare hypotheses session before using the copied judge prompt; the Live Run Observatory will evaluate the real callbacks while saved practice stays untouched.</span>
      </div>
      <button type="button" onClick={copyPrompt}>
        {copyStatus === "copied" ? "First prompt copied" : "Copy first agent prompt"}
      </button>
      {copyStatus === "failed" && (
        <span className="demo-notice__error" role="status">
          Clipboard access is unavailable. The prompt is also in the judge guide.
        </span>
      )}
    </section>
  );
}
