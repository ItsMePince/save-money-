import React from "react";
import "../tax.css";

type Props = {
  total: number;
  active: number;
  completed?: boolean[];
  onClickStep?: (n: number) => void;
  labels?: string[];
};

export default function WizardProgress({ total, active, completed = [], onClickStep, labels = [] }: Props) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="wizard-progress">
      {steps.map((n) => {
        const idx = n - 1;
        const isActive = n === active;
        const isVisited = completed[idx];
        return (
          <div className="wizard-item" key={n}>
            <button
              type="button"
              className={[
                "wizard-dot",
                isActive ? "is-active" : "",
                isVisited ? "is-visited" : "",
              ].join(" ").trim()}
              onClick={() => (isVisited || isActive) && onClickStep?.(n)}
            >
              {n}
            </button>
            {labels[idx] && <div className="wizard-label">{labels[idx]}</div>}
          </div>
        );
      })}
    </div>
  );
}