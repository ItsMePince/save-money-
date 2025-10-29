// src/pages/AccountNew.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./accountnew.css";
import { Building2, Banknote, Landmark, CreditCard, Wallet, PiggyBank, Coins } from "lucide-react";
import BottomNav from "./buttomnav";

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

// (ข้อมูล Account ที่รับมาจาก state ตอนกด "แก้ไข")
// ‼️ หมายเหตุ: คุณจะต้องเพิ่ม 'id' เข้ามาใน type นี้ด้วยในอนาคต
//               เพื่อให้ "แก้ไข" (Edit) ใช้งานได้
type AccountLocationState = {
    id?: number; // <--- เราต้องการ ID จาก Database ตรงนี้
    name: string;
    amount: number;
    iconKey?: string;
    type?: AccountType
};

// --- REMOVED ---
// ลบ function loadAccounts() และ saveAccounts() ออก
// เราจะใช้ API เรียกข้อมูลจาก Backend แทน

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

    // state ที่รับมาตอนกด "แก้ไข" (ถ้ามี)
    const editState = state as | { mode: "edit"; account: AccountLocationState } | undefined;

    const [name, setName] = useState("");
    const [type, setType] = useState<AccountType | "">("");
    const [amount, setAmount] = useState<string>("");
    const [iconKey, setIconKey] = useState<string>("bank");
    const [openType, setOpenType] = useState(false);

    const SelectedIcon = useMemo(() => ICONS.find((i) => i.key === iconKey)?.Icon ?? Building2, [iconKey]);

    // preload edit state
    useEffect(() => {
        if (editState?.mode === "edit" && editState.account) {
            const a = editState.account;
            setName(a.name ?? "");
            setAmount(typeof a.amount === "number" && !Number.isNaN(a.amount) ? formatIntWithGrouping(String(a.amount)) : "");
            setIconKey(a.iconKey ?? "bank");
            setType(a.type ?? "");
        }
    }, [editState]);

    // ---------- Amount: caret + auto scroll-right ----------
    const amountRef = useRef<HTMLInputElement | null>(null);
    const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = e.currentTarget;
        const raw = el.value;
        const prevPos = el.selectionStart ?? raw.length;

        const digits = raw.replace(/\D/g, "");
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
    // -------------------------------------------------------

    // --- CHANGED ---
    // เปลี่ยน handleSubmit ให้เรียก API (fetch) แทน localStorage
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const amt = parseMoney(amount);
        if (!name.trim() || !type || Number.isNaN(amt)) {
            alert("กรอกข้อมูลให้ครบและจำนวนเงินให้ถูกต้องก่อนน้าา");
            return;
        }

        // 1. สร้าง JSON payload ให้ตรงกับ CreateAccountRequest.java
        const payload = {
            name: name.trim(),
            type: type as AccountType, // "ธนาคาร", "เงินสด" (Backend รับ String ไทยได้)
            amount: amt,               // Backend รับเป็น Double
            iconKey: iconKey,
        };

        const isEditMode = editState?.mode === 'edit';

        // กำหนด URL และ Method (สร้าง = POST, แก้ไข = PUT)
        let url = "http://localhost:8081/api/accounts";
        let method = "POST";

        if (isEditMode) {
            // ‼️ หมายเหตุ: ดูคำอธิบายเรื่อง "แก้ไข" ด้านล่าง
            const accountId = editState.account.id;
            if (!accountId) {
                alert("เกิดข้อผิดพลาด: ไม่พบ ID ของบัญชีที่ต้องการแก้ไข");
                return;
            }
            url = `http://localhost:8081/api/accounts/${accountId}`;
            method = "PUT";
        }

        try {
            // 2. ส่ง Request (ยิง API) ไปหา Spring Boot
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                // 3. สำคัญมาก! ส่ง Cookie (Session) ไปด้วยเพื่อยืนยันตัวตน
                credentials: "include"
            });

            if (response.ok) {
                // 4. ถ้าสำเร็จ (Backend ตอบ 200 OK)
                navigate("/home"); // กลับไปหน้าหลัก
            } else {
                // 5. ถ้าล้มเหลว (เช่น 401 Unauthorized, 404 Not Found)
                const errorText = await response.text();
                alert(`บันทึกไม่สำเร็จ: ${errorText}`);
            }
        } catch (error) {
            // 6. กรณี Network Error (เชื่อมต่อ Backend ไม่ได้)
            console.error("Error submitting account:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    }

    return (
        <div className="accnew-wrap">
            <h1 className="title">{editState?.mode === "edit" ? "แก้ไขบัญชี" : "สร้างบัญชี"}</h1>

            <form className="form" onSubmit={handleSubmit}>
                {/* ชื่อบัญชี */}
                <label className="row">
                    <span className="label">ชื่อบัญชี</span>
                    <input
                        className="input text"
                        placeholder="ชื่อบัญชี"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={120}
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
                            onMouseDown={(e) => e.preventDefault()} // กัน blur ระหว่างคลิก
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

                {/* จำนวนเงิน */}
                <label className="row">
                    <span className="label">จำนวนเงิน</span>
                    <div
                        className="amount-wrap"
                        style={{
                            flex: "1 1 0%",
                            minWidth: 0,
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr) auto",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                        }}
                    >
                        <input
                            ref={amountRef}
                            className="input number"
                            inputMode="numeric"
                            value={amount}
                            onChange={onAmountChange}
                            aria-label="จำนวนเงิน"
                            style={{
                                display: "block",
                                width: "100%",
                                minWidth: 0,
                                textAlign: "right",
                                whiteSpace: "nowrap",
                                overflowX: "auto",
                                overflowY: "hidden",
                                WebkitOverflowScrolling: "touch",
                                paddingRight: 0,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        />
                        <span
                            className="unit"
                            aria-hidden="true"
                            style={{ position: "static", transform: "none", whiteSpace: "nowrap", color: "var(--muted)" }}
                        >
              บาท
            </span>
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