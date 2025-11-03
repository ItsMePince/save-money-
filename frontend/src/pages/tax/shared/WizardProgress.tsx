import React from "react";
import "../tax.css";

type Props = {
    total: number;
    active: number;
    completed?: boolean[];
    onClickStep?: (n: number) => void;
    labels?: string[];
    chunkSize?: number; // ⬅️ 1. เพิ่ม prop นี้
};

export default function WizardProgress({
                                           total,
                                           active,
                                           completed = [],
                                           onClickStep,
                                           labels = [],
                                           chunkSize, // ⬅️ 2. รับค่า prop นี้
                                       }: Props) {

    // --- ⬇️ 3. เพิ่ม Logic การแบ่ง Chunk ---

    // ถ้าไม่ส่ง chunkSize มา ก็ให้แสดงผลทั้งหมด (เท่ากับ total)
    const effectiveChunkSize = chunkSize ?? total;

    // คำนวณว่าเราอยู่ "ชิ้น" ที่เท่าไหร่ (เช่น active = 5, chunkSize = 4 -> เราอยู่ชิ้นที่ 1 (index 1))
    const currentChunkIndex = Math.floor((active - 1) / effectiveChunkSize);

    // หาเลข Index เริ่มต้นของชิ้นนั้น (เช่น ชิ้นที่ 1 * 4 = 4)
    const startIndex = currentChunkIndex * effectiveChunkSize;

    // หาเลข Index สุดท้าย (เช่น 4 + 4 = 8)
    const endIndex = Math.min(startIndex + effectiveChunkSize, total);

    // สร้าง array ของ "เลข step ทั้งหมด" ก่อน
    const allSteps = Array.from({ length: total }, (_, i) => i + 1); // [1, 2, ... 8]

    // "หั่น" เอาเฉพาะ steps ที่จะแสดงผล
    // เช่น [1, 2, 3, 4] หรือ [5, 6, 7, 8]
    const steps = allSteps.slice(startIndex, endIndex);

    // --- ⬆️ สิ้นสุด Logic ใหม่ ---

    return (
        <div className="wizard-progress">

            {/* 4. ส่วนที่เหลือ (map) เหมือนเดิม
          มันจะวนลูป steps ที่ถูกหั่นมาแล้ว (4 รอบ) โดยอัตโนมัติ
      */}
            {steps.map((n) => {
                const idx = n - 1; // 'idx' คือ index จริง (เช่น 0-7)
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
                        {/* labels[idx] จะดึงป้ายชื่อที่ถูกต้อง (เช่น 'กองทุนอื่นๆ') มาแสดง */}
                        {labels[idx] && <div className="wizard-label">{labels[idx]}</div>}
                    </div>
                );
            })}
        </div>
    );
}