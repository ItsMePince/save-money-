// pages/tax/steps/03-Fund/FundStep.test.tsx
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---- Mocks ----
vi.mock("../../shared/AmountInput", () => ({
    default: (props: any) => {
        const { label, placeholder, value, onChange, name } = props;
        return (
            <label>
                {/* ให้หาได้จากตัว label เดิมด้วย (ถ้าเป็น element) */}
                <span>{typeof label === "string" ? label : null}{label}</span>
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
                    <button onClick={onBack} aria-label="ย้อนกลับ">
                        ย้อนกลับ
                    </button>
                )}
                <button onClick={onNext} aria-label="ถัดไป">
                    ถัดไป
                </button>
            </div>
        );
    },
}));

// SUT
import FundStep from "./FundStep";

// ---- Host component เพื่อเก็บ state เหมือนหน้าแม่ ----
function Host({
                  onBack = vi.fn(),
                  onNext = vi.fn(),
                  initial = {} as any,
              }) {
    const [values, setValues] = useState(initial);
    return (
        <FundStep
            values={values}
            setValues={(patch) => setValues((v: any) => ({ ...v, ...patch }))}
            onBack={onBack}
            onNext={onNext}
        />
    );
}

describe("FundStep", () => {
    let user: ReturnType<typeof userEvent.setup>;
    beforeEach(() => {
        user = userEvent.setup();
    });

    it("เรนเดอร์หัวข้อ, ป้าย PVD + ปุ่ม i, input ทั้ง 3 ช่อง และปุ่มย้อนกลับ/ถัดไป", () => {
        render(<Host />);

        // หัวข้อ
        expect(
            screen.getByText("กองทุน เบี้ยประกันสังคม และกู้ที่อยู่อาศัย")
        ).toBeInTheDocument();

        // ป้าย PVD และปุ่ม i
        expect(
            screen.getByText("กองทุนสำรองเลี้ยงชีพ (PVD)")
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "ข้อมูลเพิ่มเติม" })
        ).toBeInTheDocument();

        // input รวม 3 ช่อง (AmountInput ทั้งหมดใช้ placeholder เดียวกัน)
        const inputs = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");
        expect(inputs).toHaveLength(3);

        // ปุ่มย้อนกลับ/ถัดไป จาก FooterNav
        expect(screen.getByRole("button", { name: "ย้อนกลับ" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ถัดไป" })).toBeInTheDocument();
    });

    it("กดปุ่ม i แล้วแสดง dialog และปิดได้ทั้งจากปุ่ม 'ปิด' และคลิกพื้นหลัง", async () => {
        render(<Host />);

        // เปิด
        await user.click(screen.getByRole("button", { name: "ข้อมูลเพิ่มเติม" }));
        const dialog = screen.getByRole("dialog", { hidden: false });
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText("เงินออมเพื่อเกษียณของพนักงานบริษัท")).toBeInTheDocument();

        // ปิดด้วยปุ่ม "ปิด"
        await user.click(screen.getByRole("button", { name: "ปิด" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        // เปิดอีกครั้ง
        await user.click(screen.getByRole("button", { name: "ข้อมูลเพิ่มเติม" }));
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        // ปิดด้วยคลิกพื้นหลัง (backdrop มี className tip-backdrop)
        await user.click(screen.getByText((content, el) => el?.className === "tip-backdrop"));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("พิมพ์ค่าเข้าแต่ละช่องได้ และกดปุ่มถัดไป/ย้อนกลับเรียก callback", async () => {
        const onBack = vi.fn();
        const onNext = vi.fn();
        render(<Host onBack={onBack} onNext={onNext} />);

        const [pvdInput, ssInput, mortgageInput] = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");

        await user.type(pvdInput, "12000");
        await user.type(ssInput, "9000");
        await user.type(mortgageInput, "100000");

        expect(pvdInput).toHaveValue("12000");
        expect(ssInput).toHaveValue("9000");
        expect(mortgageInput).toHaveValue("100000");

        await user.click(screen.getByRole("button", { name: "ถัดไป" }));
        expect(onNext).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", { name: "ย้อนกลับ" }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("แสดงข้อความ note ของแต่ละสิทธิ์ลดหย่อนครบถ้วน", () => {
        render(<Host />);

        expect(
            screen.getByText(/ไม่เกิน 15% ของเงินเดือน/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/ไม่เกิน 9,000 บาท/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/ไม่เกิน 100,000 บาท/i)
        ).toBeInTheDocument();
    });
});
