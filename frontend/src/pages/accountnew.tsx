// src/pages/AccountNew.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./accountnew.css";
import {
  Building2, Banknote, Landmark, CreditCard, Wallet, PiggyBank, Coins,
} from "lucide-react";
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

type Account = { name: string; amount: number; iconKey?: string; type?: AccountType };

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem("accounts");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function saveAccounts(list: Account[]) {
  localStorage.setItem("accounts", JSON.stringify(list));
}

/* ---------- helpers: amount + caret ---------- */
const formatIntWithGrouping = (digitsOnly: string) =>
  digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const countDigitsBefore = (s: string, pos: number) =>
  s.slice(0, pos).replace(/\D/g, "").length;

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
  const editState = state as | { mode: "edit"; index: number; account: Account } | undefined;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | "">("");
  const [amount, setAmount] = useState<string>("");
  const [iconKey, setIconKey] = useState<string>("bank");
  const [openType, setOpenType] = useState(false);

  const SelectedIcon = useMemo(
    () => ICONS.find((i) => i.key === iconKey)?.Icon ?? Building2,
    [iconKey]
  );

  // preload edit state
  useEffect(() => {
    if (editState?.mode === "edit" && editState.account) {
      const a = editState.account;
      setName(a.name ?? "");
      setAmount(
        typeof a.amount === "number" && !Number.isNaN(a.amount)
          ? formatIntWithGrouping(String(a.amount))
          : ""
      );
      setIconKey(a.iconKey ?? "bank");
      setType(a.type ?? "");
    }
  }, [editState]);

  // close type dropdown on outside click
  const typeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!typeRef.current) return;
      if (!typeRef.current.contains(e.target as Node)) setOpenType(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* ---------- Amount: caret + auto scroll-right ---------- */
  const amountRef = useRef<HTMLInputElement | null>(null);

  const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const raw = el.value;
    const prevPos = el.selectionStart ?? raw.length;

    // เก็บเฉพาะตัวเลข → ฟอร์แมตหลักพัน (ยาวแค่ไหนก็ได้)
    const digits = raw.replace(/\D/g, "");
    const formatted = digits ? formatIntWithGrouping(digits) : "";

    // caret mapping
    const digitsBefore = countDigitsBefore(raw, prevPos);
    const nextPos = mapDigitsToCursorPos(formatted, digitsBefore);

    setAmount(formatted);

    // ตั้ง caret กลับ + เลื่อนให้เห็นปลายขวาทันที
   requestAnimationFrame(() => {
  const inputEl = amountRef.current;
  if (inputEl) {
    // เก็บตำแหน่งสกอลล์เดิมไว้ เพื่อไม่ให้กระโดดไปท้ายขวา
    const prevScroll = inputEl.scrollLeft;
    inputEl.selectionStart = inputEl.selectionEnd = nextPos;
    inputEl.scrollLeft = prevScroll; // คืนค่าเดิม
  }
});

  };
  /* ------------------------------------------------------- */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseMoney(amount);
    if (!name.trim() || !type || Number.isNaN(amt)) {
      alert("กรอกข้อมูลให้ครบและจำนวนเงินให้ถูกต้องก่อนน้าา");
      return;
    }
    const nextItem: Account = { name: name.trim(), amount: amt, iconKey, type: type as AccountType };
    const list = loadAccounts();

    if (editState?.mode === "edit" &&
        Number.isInteger(editState.index) &&
        editState.index >= 0 && editState.index < list.length) {
      list[editState.index] = nextItem;
    } else {
      list.push(nextItem);
    }
    saveAccounts(list);
    navigate("/home");
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
        <div className="row" ref={typeRef}>
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
        </div>
        {openType && (
          <div className="dropdown" role="listbox" aria-label="เลือกประเภทบัญชี">
            {ACCOUNT_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                className={`opt ${type === t ? "active" : ""}`}
                onClick={() => { setType(t); setOpenType(false); }}
                role="option"
                aria-selected={type === t}
              >
                {t}
              </button>
            ))}
          </div>
        )}

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

          {/* กล่องกลาง: ยืดเต็มจริงด้วย inline style */}
          <div
            className="amount-wrap"
            style={{
              flex: "1 1 0%",
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto", // [input 1fr][บาท auto]
              alignItems: "center",
              gap: 8,
              width: "100%",
            }}
          >
            <input
              ref={amountRef}
              className="input number"
              placeholder=""
              inputMode="numeric"
              value={amount}
              onChange={onAmountChange}
              aria-label="จำนวนเงิน"
              // อินพุตต้องกินเต็มคอลัมน์ + ถ้าเลขยาว เลื่อนดูได้
              style={{
                display: "block",
                width: "100%",
                minWidth: 0,
                textAlign: "right",
                whiteSpace: "nowrap",
                overflowX: "auto",
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
                paddingRight: 0, // 'บาท' อยู่คอลัมน์ขวาแล้ว
                fontVariantNumeric: "tabular-nums",
              }}
            />
            <span
              className="unit"
              aria-hidden="true"
              style={{
                position: "static",
                transform: "none",
                whiteSpace: "nowrap",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
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
