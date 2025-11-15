// src/pages/AccountNew.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./accountnew.css";
import { Building2, Banknote, Landmark, CreditCard, Wallet, PiggyBank, Coins } from "lucide-react";
import BottomNav from "./buttomnav";
import { API_BASE } from "../lib/api";

type AccountType = "เงินสด" | "ธนาคาร" | "บัตรเครดิต";
const ACCOUNT_TYPES: AccountType[] = ["เงินสด", "ธนาคาร", "บัตรเครดิต"];

const ICONS = [
    { key: "bank", label: "ธนาคาร", Icon: Building2 },
    { key: "banknote", label: "ธนบัตร", Icon: Banknote },
    { key: "landmark", label: "ออมทรัพย์", Icon: Landmark },
    { key: "credit", label: "บัตรเครดิต", Icon: CreditCard },
    { key: "wallet", label: "กระเป๋าเงิน", Icon: Wallet },
    { key: "piggy", label: "กระปุก", Icon: PiggyBank },
    { key: "coins", label: "เหรียญ", Icon: Coins },
] as const;

type AccountLocationState = {
    id?: number;
    name: string;
    amount: number;
    iconKey?: string;
    type?: AccountType
};

/* ---------- helpers: amount + caret ---------- */
const formatIntWithGrouping = (digitsOnly: string) => digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const countDigitsBefore = (s: string, pos: number) => s.slice(0, pos).replace(/\D/g, "").length;
const mapDigitsToCursorPos = (formatted: string, digitsBefore: number) => {
    if (digitsBefore <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
            seen++;
            if (seen === digitsBefore) return i + 1;
        }
    }
    return formatted.length;
};
const parseMoney = (s: string) => Number((s || "0").replace(/,/g, ""));
/* -------------------------------------------- */

export default function AccountNew() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const editState = state as | { mode: "edit"; account: AccountLocationState } | undefined;

    const [name, setName] = useState("");
    const [type, setType] = useState<AccountType | "">("");
    const [amount, setAmount] = useState<string>("");
    const [iconKey, setIconKey] = useState<string>("bank");
    const [openType, setOpenType] = useState(false);

    const SelectedIcon = useMemo(() => ICONS.find((i) => i.key === iconKey)?.Icon ?? Building2, [iconKey]);

    useEffect(() => {
        if (editState?.mode === "edit" && editState.account) {
            const a = editState.account;
            setName(a.name ?? "");
            setAmount(typeof a.amount === "number" && !Number.isNaN(a.amount) ? formatIntWithGrouping(String(a.amount)) : "");
            setIconKey(a.iconKey ?? "bank");
            setType(a.type ?? "");
        }
    }, [editState]);

    const amountRef = useRef<HTMLInputElement | null>(null);
    const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = e.currentTarget;
        const raw = el.value;
        const prevPos = el.selectionStart ?? raw.length;

        const digits = raw.replace(/\D/g, "");

        // จำกัดแค่ 8 หลัก (ไม่นับคอมม่า)
        if (digits.length > 8) return;

        const formatted = digits ? formatIntWithGrouping(digits) : "";

        const digitsBefore = countDigitsBefore(raw, prevPos);
        const nextPos = mapDigitsToCursorPos(formatted, digitsBefore);

        setAmount(formatted);

        requestAnimationFrame(() => {
            const inputEl = amountRef.current;
            if (inputEl) {
                const prevScroll = inputEl.scrollLeft;
                inputEl.selectionStart = inputEl.selectionEnd = nextPos;
                inputEl.scrollLeft = prevScroll;
            }
        });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const amt = parseMoney(amount);
        if (!name.trim() || !type || Number.isNaN(amt)) {
            alert("กรอกข้อมูลให้ครบและจำนวนเงินให้ถูกต้องก่อนน้าา");
            return;
        }

        const payload = {
            name: name.trim(),
            type: type as AccountType,
            amount: amt,
            iconKey: iconKey,
        };

        const isEditMode = editState?.mode === 'edit';

        let url = `${API_BASE}/accounts`;
        let method = "POST";

        if (isEditMode) {
            const accountId = editState.account.id;
            if (!accountId) {
                alert("เกิดข้อผิดพลาด: ไม่พบ ID ของบัญชีที่ต้องการแก้ไข");
                return;
            }
            url = `${API_BASE}/accounts/${accountId}`;
            method = "PUT";
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            if (response.ok) {
                navigate("/home");
            } else {
                const errorText = await response.text();
                alert(`บันทึกไม่สำเร็จ: ${errorText}`);
            }
        } catch (error) {
            console.error("Error submitting account:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    }

    return (
        <div className="accnew-wrap">
            <h1 className="title">{editState?.mode === "edit" ? "แก้ไขบัญชี" : "สร้างบัญชี"}</h1>

            <form className="form" onSubmit={handleSubmit}>
                {/* ชื่อบัญชี - จำกัด 20 ตัวอักษร */}
                <label className="row">
                    <span className="label">ชื่อบัญชี</span>
                    <input
                        className="input text"
                        placeholder="ชื่อบัญชี"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={20}
                        autoFocus
                    />
                </label>

                {/* ประเภทบัญชี */}
                <div className="row" style={{ position: "relative", overflow: "visible" }}>
                    <span className="label">ประเภทบัญชี</span>

                    <button
                        type="button"
                        className="select"
                        onClick={() => setOpenType((o) => !o)}
                        aria-haspopup="listbox"
                        aria-expanded={openType}
                    >
                        <span className={type ? "" : "placeholder"}>{type || "ประเภท"}</span>
                        <span className="chev">▾</span>
                    </button>

                    {openType && (
                        <div
                            className="dropdown"
                            role="listbox"
                            aria-label="เลือกประเภทบัญชี"
                            onMouseDown={(e) => e.preventDefault()}
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "100%",
                                marginTop: 6,
                                zIndex: 100,
                            }}
                        >
                            {ACCOUNT_TYPES.map((t) => (
                                <button
                                    type="button"
                                    key={t}
                                    className={`opt ${type === t ? "active" : ""}`}
                                    onClick={() => {
                                        setType(t);
                                        setOpenType(false);
                                    }}
                                    role="option"
                                    aria-selected={type === t}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ไอคอน */}
                <div className="row">
                    <span className="label">ไอคอน</span>
                    <div className="icon-current" aria-label="ไอคอนที่เลือก">
                        <SelectedIcon className="icon" />
                    </div>
                </div>
                <div className="icon-grid" role="group" aria-label="เลือกไอคอน">
                    {ICONS.map(({ key, Icon, label }) => (
                        <button
                            type="button"
                            key={key}
                            className={`icon-chip ${iconKey === key ? "active" : ""}`}
                            onClick={() => setIconKey(key)}
                            aria-pressed={iconKey === key}
                            aria-label={label}
                            title={label}
                        >
                            <Icon className="icon" />
                        </button>
                    ))}
                </div>

                {/* จำนวนเงิน - จำกัด 8 หลัก (ไม่นับคอมม่า) */}
                <label className="row">
                    <span className="label">จำนวนเงิน</span>
                    <div className="amount-wrap">
                        <input
                            ref={amountRef}
                            className="input number"
                            inputMode="numeric"
                            placeholder="0"
                            value={amount}
                            onChange={onAmountChange}
                            aria-label="จำนวนเงิน"
                        />
                        <span className="unit" aria-hidden="true">บาท</span>
                    </div>
                </label>

                <div className="actions">
                    <button className="primary" type="submit">
                        {editState?.mode === "edit" ? "บันทึกการแก้ไข" : "ยืนยัน"}
                    </button>
                </div>
            </form>

            <BottomNav />
        </div>
    );
}