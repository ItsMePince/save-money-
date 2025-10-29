import React from "react";

type Props = {
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  showBack?: boolean;
  nextLabel?: string;
  /** ตั้ง false เพื่อซ่อนปุ่มถัดไปได้ */
  showNext?: boolean;
};

export default function FooterNav({
  onNext,
  onBack,
  nextDisabled,
  showBack = false,
  nextLabel = "ถัดไป",
  showNext = true,
}: Props) {
  const shouldShowNext = showNext !== false && typeof onNext === "function";

  return (
    <div className="footer-nav">
      {showBack && (
        <button className="btn-back" type="button" onClick={onBack}>
          ย้อนกลับ
        </button>
      )}

      {shouldShowNext && (
        <button
          type="button"
          className="btn-next"
          onClick={onNext}
          disabled={!!nextDisabled}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}