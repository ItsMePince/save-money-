import React, { useMemo } from "react";

type Props = {
  label: React.ReactNode;
  placeholder?: string;
  optional?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  name?: string;
};

const formatWithComma = (raw: string) => {
  const num = raw.replace(/[^\d]/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString("en-US");
};

export default function AmountInput({ label, placeholder = "ระบุจำนวนเงิน", optional, value, onChange, name }: Props) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const fmt = formatWithComma(e.target.value);
    onChange?.(fmt);
  };
  const opt = useMemo(() => (optional ? <span className="opt">(Optional)</span> : null), [optional]);

  return (
    <label className="amount-field">
      <div className="amount-label">
        <span>{label}</span>
        {opt}
      </div>
      <input
        name={name}
        inputMode="numeric"
        className="amount-input"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={handleChange}
      />
    </label>
  );
}