// src/pages/income.tsx
// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./income.css";
import BottomNav from "./buttomnav";
import {
    ClipboardList, MapPin, HandCoins, Banknote, Bitcoin, CalendarDays,
    Gift, Coins, Wallet, Briefcase, Laptop, CreditCard, BarChart as BarChart, Clock, ShieldCheck,
    UserCheck, BookOpen, Camera, Bike, Car, PenTool, Code,
    PiggyBank, LineChart, FileText, Layers, TrendingUp,
    Home as HomeIcon, Bed, Building, Truck, Package,
    ShoppingBag, Store, Boxes, Tent, Ticket,
    Video, Mic, Radio, Music, Film, Gamepad,
    ClipboardCheck, Trophy, GraduationCap,
    Coffee, Star, Gem,
    CircuitBoard, Image, Cloud, Lock,
    Link, Megaphone, FileBadge, Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePaymentMethod } from "../PaymentMethodContext";
import { useEditPrefill } from "../hooks/useEditPrefill";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8081";

const ChevronDown = () => (
    <svg viewBox="0 0 24 24" className="icon">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconEtc = ({ active = false }: { active?: boolean }) => (
    <svg viewBox="0 0 24 24" className={`icon ${active ? "icon-active" : ""}`}>
        <circle cx="5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="19" cy="12" r="1.8" />
    </svg>
);
const IconBackspace = () => (
    <svg viewBox="0 0 24 24" className="icon">
        <path d="M4 12 9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9L4 12Zm6-3 6 6m0-6-6 6"
              stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconCheck = () => (
    <svg viewBox="0 0 24 24" className="icon">
        <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

type Category = "ค่าขนม" | "ทำงาน" | "ลงทุน" | "อื่นๆ";

const ICON_MAP: Record<string, React.FC<any>> = {
    Briefcase, BarChart, Clock, Wallet, ShieldCheck,
    Laptop, UserCheck, BookOpen, Camera, Bike, Car, PenTool, Code, Banknote,
    Coins, PiggyBank, LineChart, FileText, Layers, TrendingUp,
    Home: HomeIcon, Bed, Building, Truck, Package,
    ShoppingBag, Store, Boxes, Tent, CreditCard, Ticket,
    Video, Mic, Radio, Music, Film, Gamepad,
    ClipboardList, ClipboardCheck, Trophy, GraduationCap,
    Gift, Coffee, Star, Gem, HandCoins,
    Bitcoin, CircuitBoard, Image, Cloud, Lock,
    Link, Megaphone, FileBadge, Users,
};

const getTodayISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const getNowHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};
const getNowLocalDT = () => `${getTodayISO()}T${getNowHHMM()}`;

const defaultIconKeyByCategory: Record<Category, string> = {
    "ค่าขนม": "HandCoins",
    "ทำงาน": "Banknote",
    "ลงทุน": "Bitcoin",
    "อื่นๆ": "more",
};

const DRAFT_KEY = "income_draft_v2";
const safeParse = (raw: any) => { try { return JSON.parse(raw ?? ""); } catch { return {}; } };
const readDraftNow = () => safeParse(sessionStorage.getItem(DRAFT_KEY));
const saveDraft = (patch: Record<string, any>) => {
    const cur = readDraftNow();
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...cur, ...patch }));
};

export default function Income() {
    const navigate = useNavigate();
    const location = useLocation();
    const { payment, setPayment } = usePaymentMethod();

    const initial = readDraftNow();

    const [category, setCategory] = useState<Category>(() => initial.category ?? "ค่าขนม");
    const [customCat, setCustomCat] = useState<{ label: string; icon?: string } | null>(() => initial.customCat ?? null);
    const [amount, setAmount] = useState<string>(() => initial.amount ?? "0");
    const [note, setNote] = useState<string>(() => initial.note ?? "");
    const [place, setPlace] = useState<string>(() => initial.place ?? "");
    const [dt, setDt] = useState<string>(() => initial.dt ?? getNowLocalDT());
    const [menuOpen, setMenuOpen] = useState(false);

    useEditPrefill((d) => {
        setCategory((d.category as Category) ?? "ค่าขนม");
        setCustomCat(null);
        setAmount(String(d.amount ?? "0"));
        setNote(d.note ?? "");
        setPlace(d.place ?? "");
        setDt(d.datetime || `${d.date}T${getNowHHMM()}`);
    }, "edit_id_income");

    useEffect(() => {
        if (initial.payment && !payment) setPayment(initial.payment);
    }, []);

    useEffect(() => {
        const st = location.state as any;
        if (st?.customIncome) {
            setCategory("อื่นๆ");
            setCustomCat({ label: st.customIncome.label, icon: st.customIncome.icon });
            saveDraft({ category: "อื่นๆ", customCat: { label: st.customIncome.label, icon: st.customIncome.icon } });
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, navigate]);

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

    const pad = useMemo(() => ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"], []);
    const onTapKey = (k: string) => {
        let next = amount;
        if (k === "⌫") next = next.length <= 1 ? "0" : next.slice(0, -1);
        else if (k === ".") next = next.includes(".") ? next : next + ".";
        else next = next === "0" ? k : next + k;
        setAmount(next);
        saveDraft({ amount: next });
    };

    const dtRef = useRef<HTMLInputElement>(null);
    const openDateTimePicker = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.preventDefault();
        const el = dtRef.current;
        if (!el) return;
        if (typeof (el as any).showPicker === "function") (el as any).showPicker();
        else { el.click(); el.focus(); }
    };

    useEffect(() => {
        const onFocus = () => {
            const name = sessionStorage.getItem("selectedPlaceName");
            if (name && name !== place) {
                setPlace(name);
                saveDraft({ place: name });
                sessionStorage.removeItem("selectedPlaceName");
            }
        };
        window.addEventListener("focus", onFocus);
        onFocus();
        return () => window.removeEventListener("focus", onFocus);
    }, [place]);

    const resetAll = () => {
        setCategory("ค่าขนม"); setCustomCat(null); setPayment(null);
        setAmount("0"); setNote(""); setPlace(""); setDt(getNowLocalDT()); setMenuOpen(false);
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem("edit_id_income");
    };

    const onConfirm = async () => {
        if (!amount || amount === "0" || !place.trim() || !dt) {
            alert("Required ❌"); return;
        }
        const finalCategory = category === "อื่นๆ" && customCat?.label ? customCat.label : category;
        const iconKey = category === "อื่นๆ" ? (customCat?.icon || "more") : defaultIconKeyByCategory[category];
        const dateOnly = dt.slice(0, 10);
        const occurredAtISO = new Date(`${dt}:00`).toISOString();

        const payload = {
            type: "รายได้",
            category: finalCategory,
            amount: parseFloat(amount || "0"),
            note,
            place,
            date: dateOnly,
            occurredAt: occurredAtISO,
            paymentMethod: payment?.name ?? null,
            iconKey,
        };

        const editId = sessionStorage.getItem("edit_id_income");
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
            resetAll();
            navigate("/summary");
        } catch (e: any) {
            console.error(e);
            alert("บันทึกไม่สำเร็จ ❌ " + (e?.message ?? ""));
        }
    };

    const formatDateTimeThai = (localDT: string) => {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDT)) return "วัน / เดือน / ปี เวลา";
        const [d, t] = localDT.split("T");
        const [y, m, dd] = d.split("-");
        return `${dd}/${m}/${y} ${t} น.`;
    };

    const renderCustomIcon = () => {
        if (!customCat?.icon) return <IconEtc active={category === "อื่นๆ"} />;
        const Cmp = ICON_MAP[customCat.icon];
        if (!Cmp) return <IconEtc active={category === "อื่นๆ"} />;
        return <Cmp className={`icon ${category === "อื่นๆ" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} />;
    };

    return (
        <div className="calc-wrap">
            <header className="topbar"></header>

            <div className="type-pill" style={{ position: "relative" }}>
                <button className="pill" onClick={() => setMenuOpen(o => !o)}>
                    <span>รายได้</span><ChevronDown />
                </button>
                {menuOpen && (
                    <div
                        onMouseLeave={() => setMenuOpen(false)}
                        style={{
                            position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#fff",
                            border: "1px solid rgba(0,0,0,.06)", borderRadius: 14, boxShadow: "0 10px 20px rgba(0,0,0,.08)", padding: 6, minWidth: 220, zIndex: 20
                        }}>
                        <button
                            onClick={() => navigate("/expense")}
                            style={{ width: "100%", textAlign: "center", padding: "10px 12px", border: 0, background: "transparent", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "var(--ink)" as any }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f3fbf8"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            ค่าใช้จ่าย
                        </button>
                    </div>
                )}
            </div>

            <div className="category-row">
                <button className={`cat ${category === "ค่าขนม" ? "active" : ""}`} onClick={() => { setCategory("ค่าขนม"); setCustomCat(null); saveDraft({ category: "ค่าขนม", customCat: null }); }}>
                    <HandCoins className={`icon ${category === "ค่าขนม" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} />
                    <span>ค่าขนม</span>
                </button>
                <button className={`cat ${category === "ทำงาน" ? "active" : ""}`} onClick={() => { setCategory("ทำงาน"); setCustomCat(null); saveDraft({ category: "ทำงาน", customCat: null }); }}>
                    <Banknote className={`icon ${category === "ทำงาน" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} />
                    <span>ทำงาน</span>
                </button>
                <button className={`cat ${category === "ลงทุน" ? "active" : ""}`} onClick={() => { setCategory("ลงทุน"); setCustomCat(null); saveDraft({ category: "ลงทุน", customCat: null }); }}>
                    <Bitcoin className={`icon ${category === "ลงทุน" ? "icon-active" : ""} lucide`} size={20} strokeWidth={2} />
                    <span>ลงทุน</span>
                </button>
                <button className={`cat ${category === "อื่นๆ" ? "active" : ""}`} onClick={() => { setCategory("อื่นๆ"); saveDraft({ category: "อื่นๆ" }); navigate("/customincome"); }}>
                    {renderCustomIcon()}
                    <span>{category === "อื่นๆ" && customCat?.label ? customCat.label : "อื่นๆ"}</span>
                </button>
            </div>

            <div className="amount" style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, width: "100%" }}>
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
                    style={{ textAlign: "center", background: "transparent", border: "none", outline: "none", fontWeight: 800, fontSize: "clamp(40px, 8vw, 64px)", lineHeight: 1, color: "var(--ink, #0a0a0a)" }}
                />
                <span className="currency" style={{ fontWeight: 800, fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 1 }}>฿</span>
            </div>

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
                        saveDraft({ category, customCat, amount, note, place, dt, payment });
                        navigate("/accountselect", { state: { from: "/income" } });
                    }}
                >
                    {payment ? payment.name : "ประเภทการชำระเงิน"}
                </button>
            </div>

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

            <div className="keypad">
                {pad.map((k, i) => (
                    <button key={i} className={`key ${k === "⌫" ? "danger" : ""}`} onClick={() => (k === "⌫" ? onTapKey("⌫") : onTapKey(k))}>
                        {k === "⌫" ? <IconBackspace /> : k}
                    </button>
                ))}
            </div>

            <div className="confirm"><button className="ok-btn" onClick={onConfirm}><IconCheck /></button></div>
            <BottomNav />
        </div>
    );
}
