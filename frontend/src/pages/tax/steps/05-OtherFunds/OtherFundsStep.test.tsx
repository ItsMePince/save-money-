// pages/tax/steps/OtherFunds/OtherFundsStep.test.tsx
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// แทนที่ mock เดิมทั้งหมดของ AmountInput ด้วยอันนี้
vi.mock("../../shared/AmountInput", () => ({
    default: (props: any) => {
        const { label, placeholder, value, onChange, name } = props;
        return (
            <label>
                {/* แสดง label ครั้งเดียว: ถ้าเป็น string ก็หุ้มด้วย <span>, ถ้าเป็น ReactNode ก็ใช้เลย */}
                {typeof label === "string" ? <span>{label}</span> : label}
                <input
                    aria-label={name}
                    placeholder={placeholder}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.currentTarget.value)}
                />
            </label>
        );
    },
}));


vi.mock("../../shared/FooterNav", () => ({
    default: (props: any) => {
        const { showBack, onBack, onNext } = props;
        return (
            <div>
                {showBack && (
                    <button onClick={onBack} aria-label="ย้อนกลับ">ย้อนกลับ</button>
                )}
                <button onClick={onNext} aria-label="ถัดไป">ถัดไป</button>
            </div>
        );
    },
}));

// SUT
import OtherFundsStep from "./OtherFundsStep";

// Host component เก็บ state เหมือนหน้าแม่
function Host({
                  onBack = vi.fn(),
                  onNext = vi.fn(),
                  initial = {} as any,
              }) {
    const [values, setValues] = useState(initial);
    return (
        <OtherFundsStep
            values={values}
            setValues={(patch) => setValues((v: any) => ({ ...v, ...patch }))}
            onBack={onBack}
            onNext={onNext}
        />
    );
}

describe("OtherFundsStep", () => {
    let user: ReturnType<typeof userEvent.setup>;
    beforeEach(() => {
        user = userEvent.setup();
    });

    it("เรนเดอร์หัวข้อ อินพุต 3 ช่อง และปุ่มย้อนกลับ/ถัดไป", () => {
        render(<Host />);

        expect(screen.getByText("กองทุนอื่นๆ")).toBeInTheDocument();

        // labels
        expect(
            screen.getByText("กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)")
        ).toBeInTheDocument();
        expect(
            screen.getByText("กองทุนออมแห่งชาติ (กอช.)")
        ).toBeInTheDocument();
        expect(
            screen.getByText("กองทุนครูเอกชน")
        ).toBeInTheDocument();

        const inputs = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");
        expect(inputs).toHaveLength(3);

        expect(screen.getByRole("button", { name: "ย้อนกลับ" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ถัดไป" })).toBeInTheDocument();
    });

    it("พิมพ์ค่าเข้าแต่ละช่องได้ และเรียก onBack/onNext เมื่อกดปุ่ม", async () => {
        const onBack = vi.fn();
        const onNext = vi.fn();
        render(<Host onBack={onBack} onNext={onNext} />);

        const [gpf, nso, teacher] = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");

        await user.type(gpf, "30000");
        await user.type(nso, "12000");
        await user.type(teacher, "15000");

        expect(gpf).toHaveValue("30000");
        expect(nso).toHaveValue("12000");
        expect(teacher).toHaveValue("15000");

        await user.click(screen.getByRole("button", { name: "ถัดไป" }));
        expect(onNext).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", { name: "ย้อนกลับ" }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("แสดงข้อความหมายเหตุของแต่ละสิทธิ์ลดหย่อนครบถ้วน", () => {
        render(<Host />);

        expect(
            screen.getByText(/ไม่เกิน 15% ของรายได้ต่อปี และรวมกับกองทุนอื่นไม่เกิน 500,000 บาท/i)
        ).toBeInTheDocument();

        expect(
            screen.getByText(/ไม่เกิน 13,200 บาท และรวมกับกองทุนอื่นและเบี้ยประกันชีวิตแบบบำนาญแล้ว\s*ไม่เกิน 500,000 บาท/i)
        ).toBeInTheDocument();

        expect(
            screen.getByText(/ไม่เกิน 15% ของรายได้ต่อปี และรวมกับกองทุนอื่นและเบี้ยประกันชีวิตแบบบำนาญแล้ว\s*ไม่เกิน 500,000 บาท/i)
        ).toBeInTheDocument();
    });
});
