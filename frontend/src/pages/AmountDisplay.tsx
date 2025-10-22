// AmountDisplay.tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  value: number | string;     // รับเลขหรือสตริงที่ฟอร์แมตมาแล้วก็ได้
  unit?: string;              // เช่น "บาท"
  max?: number;               // font-size สูงสุด (px)
  min?: number;               // font-size ต่ำสุด (px)
  className?: string;
};

const format = (v: number | string) => {
  const s = String(v);
  // ถ้าเป็นเลขดิบ → ใส่ , หลักพัน
  if (/^\d+$/.test(s)) return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return s;
};

export default function AmountDisplay({
  value,
  unit = "บาท",
  max = 28,
  min = 12,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const numRef  = useRef<HTMLSpanElement | null>(null);
  const [size, setSize] = useState(max);

  const fit = () => {
    const wrap = wrapRef.current;
    const num  = numRef.current;
    if (!wrap || !num) return;

    // เริ่มจากขนาดใหญ่สุด แล้วค่อยๆ ลดลงจนกว่าจะพอดี (มี safety cap)
    let s = max;
    num.style.fontSize = `${s}px`;
    for (let i = 0; i < 40 && (num.scrollWidth > wrap.clientWidth) && s > min; i++) {
      s -= 1;
      num.style.fontSize = `${s}px`;
    }
    setSize(s);
  };

  // เรียกตอน mount และเมื่อ value เปลี่ยน
  useLayoutEffect(() => { fit(); }, [value, max, min]);

  // รองรับ resize/container เปลี่ยนขนาด
  useEffect(() => {
    const ro = new ResizeObserver(() => fit());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`amount-display ${className}`}>
      <span ref={numRef} className="num" style={{ fontSize: size }}>
        {format(value)}
      </span>
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}
