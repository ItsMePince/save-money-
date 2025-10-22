// src/pages/expense.tsx
// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./expense.css";
import {
    ClipboardList, MapPin, CalendarDays,
    Utensils, Pizza, Drumstick, Coffee, Beer, CupSoda, IceCream, Candy, Cake,
    Car, Bus, Bike, Plane, Train, Ship, Fuel, Map, MapPin as MapPinIcon,
    Stethoscope, HeartPulse, Activity, Pill, Hospital, Ambulance,
    ShoppingCart, ShoppingBag, Gift, Tag, Shirt, CreditCard, SoapDispenserDroplet,
    Briefcase, Laptop, Calculator, BarChart, Coins, Wallet,
    BookOpen, GraduationCap, Pencil,
    Dumbbell, Goal, Trophy, Volleyball,
    Dog, Cat, Fish, Bird,
    Home, Sofa, Bed, Wrench, Hammer,
    Gamepad, Music, Film, Popcorn, Clapperboard, Sprout,
} from "lucide-react";
import BottomNav from "./buttomnav";
import { useNavigate } from "react-router-dom";
import { useTempCategory } from "../TempCategoryContext";
import { usePaymentMethod } from "../PaymentMethodContext";
import { useEditPrefill } from "../hooks/useEditPrefill";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8081";

/* ===== draft helpers ===== */
const DRAFT_KEY = "expense_draft_v2";
const safeParse = (raw: any) => { try { return JSON.parse(raw ?? ""); } catch { return {}; } };
const readDraftNow = () => safeParse(sessionStorage.getItem(DRAFT_KEY));
const saveDraft = (patch: Record<string, any>) => {
    const cur = readDraftNow();
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...cur, ...patch }));
};

type Category = "อาหาร" | "ค่าเดินทาง" | "ของขวัญ" | "อื่นๆ";

const getTodayISO = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
};
const getNowHHMM = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
};
const getNowLocalDT = () => `${getTodayISO()}T${getNowHHMM()}`;

/* icons */
const customIconByKey: Record<string, React.FC<any>> = {
    food: Utensils, pizza: Pizza, drumstick: Drumstick, coffee: Coffee, beer: Beer,
    cupsoda: CupSoda, icecream: IceCream, candy: Candy, cake: Cake,
    car: Car, bus: Bus, bike: Bike, plane: Plane, train: Train, ship: Ship,
    fuel: Fuel, map: Map, mappin: MapPinIcon,
    stethoscope: Stethoscope, heart: HeartPulse, activity: Activity,
    pill: Pill, hospital: Hospital, ambulance: Ambulance,
    cart: ShoppingCart, bag: ShoppingBag, gift: Gift, tag: Tag, shirt: Shirt, creditcard: CreditCard, soap: SoapDispenserDroplet,
    briefcase: Briefcase, laptop: Laptop, calculator: Calculator, barchart: BarChart, coins: Coins, wallet: Wallet,
    book: BookOpen, graduation: GraduationCap, pencil: Pencil,
    dumbbell: Dumbbell, goal: Goal, trophy: Trophy, volleyball: Volleyball,
    dog: Dog, cat: Cat, fish: Bird,
    home: Home, sofa: Sofa, bed: Bed, wrench: Wrench, hammer: Hammer,
    game: Gamepad, music: Music, film: Film, popcorn: Popcorn, clapper: Clapperboard, sprout: Sprout,
    more: ({ active = false }: { active?: boolean }) => (
        <svg viewBox="0 0 24 24" className={`icon ${active ? "icon-active" : ""}`}>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
        </svg>
    ),
};

const defaultIconKeyByCategory: Record<Category, string> = {
    "อาหาร": "food",
    "ค่าเดินทาง": "car",
    "ของขวัญ": "gift",
    "อื่นๆ": "more",
};

const ChevronDown = () => (
    <svg viewBox="0 0 24 24" className="icon">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IconBackspace = () => (
    <svg viewBox="0 0 24 24" className="icon">
        <path d="M4 12 9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9L4 12Zm6-3 6 6m0-6-6 6"
              stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" className="icon">
        <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default function Expense() {
    const navigate = useNavigate();
    const { tempCategory, clearTempCategory } = useTempCategory();
    const { payment, clearPayment } = usePaymentMethod();

    const draft = readDraftNow();

    const [category, setCategory] = useState<Category>(() =>
        draft.category ?? (tempCategory ? "อื่นๆ" : "อาหาร")
    );
    const [amount, setAmount]   = useState<string>(() => draft.amount ?? "0");
    const [note, setNote]       = useState<string>(() => draft.note ?? "");
    const [place, setPlace]     = useState<string>(() => draft.place ?? "");
    const [dt, setDt]           = useState<string>(() => draft.dt ?? getNowLocalDT());

    const [hydrated, setHydrated] = useState(false);
    useEffect(() => { setHydrated(true); }, []);

    /* ===== Prefill edit mode (from Summary) ===== */
    useEditPrefill((d) => {
        setCategory((d.category as Category) ?? "อื่นๆ");
        setAmount(String(d.amount ?? "0"));
        setNote(d.note ?? "");
        setPlace(d.place ?? "");
        setDt(d.datetime || `${d.date}T${getNowHHMM()}`);
    }, "edit_id_expense");

    /* ===== pick place from /location (comes back via sessionStorage) ===== */
    useEffect(() => {
        const apply = () => {
            const name = sessionStorage.getItem("selectedPlaceName");
            if (name) {
                setPlace(name);
                saveDraft({ place: name });
                sessionStorage.removeItem("selectedPlaceName");
            }
        };
        apply();
        window.addEventListener("focus", apply);
        return () => window.removeEventListener("focus", apply);
    }, []);

    /* ===== switch entry type ===== */
    const [typeOpen, setTypeOpen] = useState(false);
    const [entryType] = useState<"ค่าใช้จ่าย" | "รายได้">("ค่าใช้จ่าย");
    const menuOptions: Array<"ค่าใช้จ่าย" | "รายได้"> = entryType === "ค่าใช้จ่าย" ? ["รายได้"] : ["ค่าใช้จ่าย"];
    const onSelectType = (target: "ค่าใช้จ่าย" | "รายได้") => {
        setTypeOpen(false);
        navigate(target === "รายได้" ? "/income" : "/expense");
    };

    /* ===== sync category when coming from custom ===== */
    useEffect(() => {
        if (tempCategory && category !== "อื่นๆ") {
            setCategory("อื่นๆ");
            if (hydrated) saveDraft({ category: "อื่นๆ" });
        }
    }, [tempCategory]);

    /* ===== auto-save draft ===== */
    useEffect(() => {
        if (!hydrated) return;
        saveDraft({ category, amount, note, place, dt });
    }, [category, amount, note, place, dt, hydrated]);

    /* ===== datetime picker ===== */
    const dtRef = useRef<HTMLInputElement>(null);
    const openDateTimePicker = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.preventDefault();
        const el = dtRef.current;
        if (!el) return;
        if (typeof (el as any).showPicker === "function") (el as any).showPicker();
        else { el.click(); el.focus(); }
    };

    /* ===== keypad + typeable amount ===== */
    const pad = useMemo(() => ["1","2","3","4","5","6","7","8","9",".","0","⌫"], []);
    const onTapKey = (k: string) => {
        let next = amount;
        if (k === "⌫") next = next.length <= 1 ? "0" : next.slice(0,-1);
        else if (k === ".") next = next.includes(".") ? next : next + ".";
        else next = next === "0" ? k : next + k;
        setAmount(next);
        saveDraft({ amount: next });
    };
    const sanitizeAmount = (raw: string) => {
        let v = raw.replace(/[^\d.]/g, "");
        const parts = v.split(".");
        if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
        if (v.startsWith("0") && !v.startsWith("0.")) v = String(parseInt(v || "0", 10));
        if (v === "" || v === ".") v = "0";
        return v;
    };
    const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = sanitizeAmount(e.target.value);
        setAmount(v);
        saveDraft({ amount: v });
    };

    /* ===== reset ===== */
    const resetForm = () => {
        setCategory("อาหาร"); setAmount("0"); setNote(""); setPlace("");
        setDt(getNowLocalDT());
        clearTempCategory(); if (typeof clearPayment === "function") clearPayment();
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem("edit_id_expense");
    };

    /* ===== submit to backend ===== */
    const onConfirm = async () => {
        // note optional; require amount>0, place, dt
        if (!amount || amount === "0" || !place.trim() || !dt) {
            alert("Required ❌");
            return;
        }

        const finalCategory =
            category === "อื่นๆ" && tempCategory?.name ? tempCategory.name : category;

        const iconKey =
            category === "อื่นๆ" ? (tempCategory?.iconKey || "more") : defaultIconKeyByCategory[category];

        const dateOnly = dt.slice(0, 10); // "YYYY-MM-DD"
        const occurredAtISO = new Date(`${dt}:00`).toISOString(); // local -> ISO UTC

        // >>> Backend expects EntryType enum: EXPENSE/INCOME
        const payload = {
            type: "EXPENSE",
            category: finalCategory,
            amount: parseFloat(amount || "0"),
            note,                 // may be ""
            place,
            date: dateOnly,       // LocalDate
            occurredAt: occurredAtISO, // OffsetDateTime
            paymentMethod: payment?.name ?? null,
            iconKey,
        };

        const editId = sessionStorage.getItem("edit_id_expense");
        const isEdit = !!editId;
        const url = isEdit ? `${API_BASE}/api/expenses/${editId}` : `${API_BASE}/api/expenses`;
        const method = isEdit ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
            alert(isEdit ? "แก้ไขเรียบร้อย ✅" : "บันทึกเรียบร้อย ✅");
            resetForm();
            navigate("/summary");
        } catch (err: any) {
            console.error(err);
            alert("บันทึกไม่สำเร็จ ❌ " + (err?.message ?? ""));
        }
    };

    const formatDateTimeThai = (localDT: string) => {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDT)) return "วัน / เดือน / ปี เวลา";
        const [d, t] = localDT.split("T");
        const [y, m, dd] = d.split("-");
        return `${dd}/${m}/${y} ${t} น.`;
    };

    const otherLabel = tempCategory?.name || "อื่นๆ";
    const OtherIcon =
        (tempCategory?.iconKey && customIconByKey[tempCategory.iconKey]) || customIconByKey["more"];

    return (
        <div className="calc-wrap">
            {/* type switch */}
            <div className="type-pill" style={{ position: "relative" }}>
                <button className="pill" onClick={() => setTypeOpen(o => !o)}>
                    <span>{entryType}</span><ChevronDown />
                </button>
                {typeOpen && (
                    <div
                        onMouseLeave={() => setTypeOpen(false)}
                        style={{
                            position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#fff",
                            border: "1px solid rgba(0,0,0,.06)", borderRadius: 14, boxShadow: "0 10px 20px rgba(0,0,0,.08)", padding: 6, minWidth: 200, zIndex: 20
                        }}>
                        {menuOptions.map(op => (
                            <button
                                key={op}
                                onClick={() => onSelectType(op)}
                                style={{ width: "100%", textAlign: "center", padding: "10px 12px", border: 0, background: "transparent", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "var(--ink)" as any }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f3fbf8"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                {op}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* categories */}
            <div className="category-row">
                <button className={`cat ${category === "อาหาร" ? "active" : ""}`}
                        onClick={() => { setCategory("อาหาร"); saveDraft({ category: "อาหาร" }); }}>
                    <Utensils className={`icon ${category === "อาหาร" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} /><span>อาหาร</span>
                </button>
                <button className={`cat ${category === "ค่าเดินทาง" ? "active" : ""}`}
                        onClick={() => { setCategory("ค่าเดินทาง"); saveDraft({ category: "ค่าเดินทาง" }); }}>
                    <Car className={`icon ${category === "ค่าเดินทาง" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} /><span>ค่าเดินทาง</span>
                </button>
                <button className={`cat ${category === "ของขวัญ" ? "active" : ""}`}
                        onClick={() => { setCategory("ของขวัญ"); saveDraft({ category: "ของขวัญ" }); }}>
                    <Gift className={`icon ${category === "ของขวัญ" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} /><span>ของขวัญ</span>
                </button>
                <button className={`cat ${category === "อื่นๆ" ? "active" : ""}`}
                        onClick={() => { setCategory("อื่นๆ"); saveDraft({ category: "อื่นๆ" }); navigate("/customoutcome"); }}>
                    <OtherIcon className={`icon ${category === "อื่นๆ" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} />
                    <span>{otherLabel}</span>
                </button>
            </div>

            {/* amount */}
            <div className="amount">
                <input
                    className="amount-input"
                    value={amount}
                    onChange={onAmountChange}
                    onFocus={(e) => e.currentTarget.select()}
                    inputMode="decimal"
                    enterKeyHint="done"
                    aria-label="จำนวนเงิน"
                    spellCheck={false}
                    size={Math.max(1, amount.length)}
                />
                <span className="currency">฿</span>
            </div>

            {/* date-time + payment */}
            <div className="segments" style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                    type="button"
                    className="seg date-seg"
                    onClick={openDateTimePicker}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDateTimePicker(e)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", position: "relative" }}
                >
                    <CalendarDays className="icon" size={18} />
                    <span>{dt ? formatDateTimeThai(dt) : "วัน / เดือน / ปี เวลา"}</span>

                    <input
                        ref={dtRef}
                        type="datetime-local"
                        value={dt}
                        onChange={(e) => { const v = e.target.value; setDt(v); saveDraft({ dt: v }); }}
                        style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
                        tabIndex={-1}
                        aria-hidden="true"
                    />
                </button>

                <button
                    className="seg"
                    onClick={() => {
                        saveDraft({ category, amount, note, place, dt });
                        navigate("/accountselect");
                    }}
                >
                    {payment?.name ?? "ประเภทการชำระเงิน"}
                </button>
            </div>

            {/* note/place */}
            <div className="inputs">
                <div className="input">
                    <ClipboardList size={18} strokeWidth={2} className="icon" />
                    <input
                        value={note}
                        onChange={(e) => { const v = e.target.value; setNote(v); saveDraft({ note: v }); }}
                        onBlur={() => saveDraft({ note })}
                        placeholder="โน้ต"
                    />
                </div>
                <div className="input" onClick={() => navigate("/location")} style={{ cursor: "pointer" }}>
                    <MapPin size={18} strokeWidth={2} className="icon" />
                    <input value={place} readOnly placeholder="สถานที่" />
                </div>
            </div>

            {/* keypad */}
            <div className="keypad">
                {pad.map((k,i)=>(
                    <button key={i} className={`key ${k==="⌫"?"danger":""}`} onClick={()=> onTapKey(k)}>
                        {k==="⌫" ? <IconBackspace/> : k}
                    </button>
                ))}
            </div>

            <div className="confirm">
                <button className="ok-btn" onClick={onConfirm}><IconCheck /></button>
            </div>

            <BottomNav />
        </div>
    );
}
