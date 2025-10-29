import React, { useEffect, useState } from "react";
import {
    Utensils, X,
    Train, Wallet, CreditCard, Car, Bus, Bike,
    Coffee, Gift, Tag, ShoppingBag, ShoppingCart,
    Home as HomeIcon, HeartPulse, Activity, Fuel, MapPin,
    RefreshCw
} from "lucide-react";
import "./summary.css";
import BottomNav from "./buttomnav";
import "./buttomnav.css";
import { useNavigate } from "react-router-dom";

type ExpenseDTO = {
    id: number;
    type: "EXPENSE" | "INCOME";
    category: string;
    amount: number;
    note?: string | null;
    place?: string | null;
    occurredAt?: string | null;
    date?: string | null;
    paymentMethod?: string | null;
    iconKey?: string | null;
    userId?: number;
    username?: string;
} & Record<string, any>;

type Item = {
    id: number;
    category: string;
    paymentMethod?: string;
    iconKey?: string;
    title: string;
    tag: string;
    amount: number;
    date?: string;
    isoDate: string;
    note?: string;
    account?: string;
    location?: string;
    type: "EXPENSE" | "INCOME";
    datetimeLocal?: string;
};

type DayEntry = {
    isoKey: string;
    label: string;
    total: number;
    items: Item[];
};

const API_BASE =
    (import.meta as any)?.env?.VITE_API_BASE ||
    (import.meta as any)?.env?.REACT_APP_API_BASE ||
    "http://localhost:8081";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Utensils, Train, Wallet, CreditCard, Car, Bus, Bike, Coffee, Gift, Tag,
    ShoppingBag, ShoppingCart, Home: HomeIcon, HeartPulse, Activity, Fuel, MapPin,
    RefreshCw
};

const EN_ALIAS: Record<string, string> = {
    gift: "Gift",
    present: "Gift",
    wallet: "Wallet",
    cash: "Wallet",
    credit: "CreditCard",
    card: "CreditCard",
    food: "Utensils",
    restaurant: "Utensils",
    home: "Home",
    house: "Home",
    health: "HeartPulse",
    fuel: "Fuel",
    shopping: "ShoppingCart",
    bag: "ShoppingBag",
    map: "MapPin",
    train: "Train",
    car: "Car",
    bus: "Bus",
    bike: "Bike",
    coffee: "Coffee",
    tag: "Tag",
    activity: "Activity",
    handcoins: "Wallet"
};

const TH_ALIAS: Record<string, string> = {
    "ของขวัญ": "Gift",
    "อาหาร": "Utensils",
    "กาแฟ": "Coffee",
    "เดินทาง": "Train",
    "รถ": "Car",
    "รถยนต์": "Car",
    "รถเมล์": "Bus",
    "จักรยาน": "Bike",
    "บ้าน": "Home",
    "สุขภาพ": "HeartPulse",
    "น้ำมัน": "Fuel",
    "ช้อปปิ้ง": "ShoppingCart",
    "ซื้อของ": "ShoppingCart",
    "กระเป๋า": "ShoppingBag",
    "แผนที่": "MapPin",
    "บัตรเครดิต": "CreditCard",
    "เงินสด": "Wallet",
    "ธนาคาร": "Wallet",
    "ลงทุน": "Activity"
};

function normalizeIconKey(raw?: string | null, category?: string | null) {
    const tryDirect = (k: string) =>
        ICONS[k] ? k : Object.keys(ICONS).find((x) => x.toLowerCase() === k.toLowerCase());
    if (raw && raw.trim() !== "") {
        const k = raw.trim();
        const direct = tryDirect(k);
        if (direct) return direct;
        const alias = EN_ALIAS[k.toLowerCase()];
        if (alias) return alias;
    }
    if (category && category.trim() !== "") {
        const c = category.trim().toLowerCase();
        for (const [th, val] of Object.entries(TH_ALIAS)) {
            if (c.includes(th)) return val;
        }
        const direct = tryDirect(category);
        if (direct) return direct;
    }
    return "Utensils";
}

function IconByKey({
                       name,
                       category,
                       size = 16
                   }: {
    name?: string | null;
    category?: string | null;
    size?: number;
}) {
    const key = normalizeIconKey(name, category);
    const Icon = ICONS[key] || Utensils;
    return <Icon size={size} />;
}

function pad2(n: number) { return n.toString().padStart(2, "0"); }

function toISODate(anyDate: string): string {
    if (!anyDate) return new Date().toISOString().slice(0, 10);

    const s = anyDate.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {
        const [y, m, d] = s.split("/");
        return `${y}-${m}-${d}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split("/");
        return `${y}-${m}-${d}`;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        const [d, m, y] = s.split("-");
        return `${y}-${m}-${d}`;
    }

    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);

    return new Date().toISOString().slice(0, 10);
}

function parseIsoDateToLocal(isoOrAny: string) {
    const iso = toISODate(isoOrAny);
    const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function thaiWeekdayAbbr(d: Date) {
    const map = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    return map[d.getDay()];
}

function dayLabel(d: Date) {
    return `${thaiWeekdayAbbr(d)} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

function ddmmyyyy(d: Date) {
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function signedAmountText(n: number) {
    if (n > 0) return `+${n.toLocaleString()}`;
    if (n < 0) return `-${Math.abs(n).toLocaleString()}`;
    return "0";
}

function isoToLocalDatetime(iso?: string | null): string | undefined {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
        const tryNoTZ = new Date(iso.replace(" ", "T"));
        if (isNaN(tryNoTZ.getTime())) return undefined;
        const yyyy = tryNoTZ.getFullYear();
        const mm = String(tryNoTZ.getMonth() + 1).padStart(2, "0");
        const dd = String(tryNoTZ.getDate()).padStart(2, "0");
        const hh = String(tryNoTZ.getHours()).padStart(2, "0");
        const mi = String(tryNoTZ.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function extractLocalDatetime(e: ExpenseDTO): string | undefined {
    const iso =
        e.occurredAt ??
        (e as any).occurred_at ??
        (e as any).occurred ??
        (e as any).dateTime ??
        (e as any).datetime ??
        (e as any).dt ??
        (e as any).createdAt ??
        (e as any).created_at ??
        null;
    const fromIso = isoToLocalDatetime(iso);
    if (fromIso) return fromIso;

    const timeField =
        (e as any).time ??
        (e as any).occurredTime ??
        (e as any).occuredTime ??
        (e as any).t ??
        undefined;
    if (timeField && /^\d{2}:\d{2}(:\d{2})?$/.test(timeField) && e.date) {
        const hhmm = timeField.slice(0, 5);
        return `${e.date}T${hhmm}`;
    }
    return undefined;
}

function toDayEntries(list: ExpenseDTO[]) {
    const groups = new Map<string, any[]>();
    for (const e of list) {
        const sign = e.type === "EXPENSE" ? -1 : 1;
        const signed = sign * Math.abs(Number(e.amount));
        const dtLocal = isoToLocalDatetime(e.occurredAt);
        const isoDate = dtLocal ? dtLocal.slice(0, 10) : toISODate(e.date || "");
        const d = dtLocal ? new Date(dtLocal.replace("T", " ")) : parseIsoDateToLocal(isoDate);
        const item = {
            id: e.id,
            category: e.category,
            paymentMethod: e.paymentMethod || undefined,
            iconKey: e.iconKey || undefined,
            title: e.category,
            tag: e.paymentMethod ? e.paymentMethod : "",
            amount: isFinite(signed) ? signed : 0,
            date: ddmmyyyy(d),
            isoDate,
            note: e.note || undefined,
            account: e.paymentMethod || undefined,
            location: e.place || undefined,
            type: e.type,
            datetimeLocal: dtLocal || undefined,
        };
        if (!groups.has(isoDate)) groups.set(isoDate, []);
        groups.get(isoDate)!.push(item);
    }
    const entries = Array.from(groups.entries()).map(([key, items]) => {
        const [y, m, d] = key.split("-").map(Number);
        const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
        const total = items.reduce((s, it) => s + it.amount, 0);
        const map = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
        const lbl = `${map[dt.getDay()]} ${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`;
        return { isoKey: key, label: lbl, total, items };
    });
    entries.sort((a, b) => (a.isoKey < b.isoKey ? 1 : -1));
    return entries;
}

type ApiRepeatedTransaction = {
    id: number;
    name: string;
    account: string;
    amount: number;
    date: string; // DD/MM/YYYY
    frequency: string;
}

function mapRepeatedToExpenseDTO(rt: ApiRepeatedTransaction): ExpenseDTO {
    const amt = Number(rt.amount || 0);
    const iso = toISODate(rt.date);
    return {
        id: rt.id,
        type: "EXPENSE",
        category: rt.name,
        amount: Math.abs(isFinite(amt) ? amt : 0),
        note: `(ซ้ำ: ${rt.frequency})`,
        place: null,
        date: iso,
        occurredAt: null,
        paymentMethod: rt.account,
        iconKey: "RefreshCw"
    }
}

type EditForm = {
    typeLabel: "ค่าใช้จ่าย" | "รายได้";
    category: string;
    amount: number;
    note: string;
    place: string;
    date: string;
    paymentMethod: string;
    iconKey: string;
    datetime?: string;
};

function itemToForm(it: Item): EditForm {
    return {
        typeLabel: it.type === "EXPENSE" ? "ค่าใช้จ่าย" : "รายได้",
        category: it.category,
        amount: Math.abs(it.amount),
        note: it.note ?? "",
        place: it.location ?? "",
        date: it.isoDate,
        paymentMethod: it.paymentMethod ?? "",
        iconKey: it.iconKey ?? "Utensils",
        datetime: it.datetimeLocal
    };
}

export default function Summary() {
    const [selected, setSelected] = useState<Item | null>(null);
    const [entries, setEntries] = useState<DayEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState<EditForm | null>(null);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const loadExpenses = async () => {
        setLoading(true);
        setError(null);
        try {
            const [resExpenses, resRepeated] = await Promise.all([
                fetch(`${API_BASE}/api/expenses`, {
                    headers: { Accept: "application/json" },
                    credentials: "include",
                }),
                fetch(`${API_BASE}/api/repeated-transactions`, {
                    headers: { Accept: "application/json" },
                    credentials: "include",
                })
            ]);

            if (!resExpenses.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${resExpenses.status})`);
            if (!resRepeated.ok) throw new Error(`โหลดรายการซ้ำไม่สำเร็จ (${resRepeated.status})`);

            const serverData: ExpenseDTO[] = await resExpenses.json();
            const repeatedData: ApiRepeatedTransaction[] = await resRepeated.json();

            const repeatedAsExpenses = repeatedData.map(mapRepeatedToExpenseDTO);

            const all = [...serverData, ...repeatedAsExpenses];

            setEntries(toDayEntries(all));
        } catch (e: any) {
            setError(e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadExpenses(); }, []);

    useEffect(() => {
        const reload = () => loadExpenses();
        const onStorage = (e: StorageEvent) => {
            if (e.key === "accounts") reload();
        };
        window.addEventListener("accountsUpdated", reload);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("accountsUpdated", reload);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    const onEdit = (it: Item) => {
        const isRepeated = it.note?.includes("(ซ้ำ:");

        if (isRepeated) {
            navigate('/repeated-transactions', { state: { editId: it.id } });
        } else {
            setForm(itemToForm(it));
            setEditMode(true);
            setSelected(it);
            const f = itemToForm(it);
            const route = f.typeLabel === "รายได้" ? "/income-edit" : "/expense-edit";
            navigate(route, {
                state: { mode: "edit", data: { ...f, id: it.id } },
            });
        }
    };

    const tryDeleteEndpoints = async (id: number, note: string | undefined) => {
        const isRepeated = note?.includes("(ซ้ำ:");

        const url = isRepeated
            ? `${API_BASE}/api/repeated-transactions/${id}`
            : `${API_BASE}/api/expenses/${id}`;

        const res = await fetch(url, {
            method: "DELETE",
            credentials: "include"
        });

        return res.ok;
    };

    const onDelete = async (it: Item) => {
        if (!window.confirm("ลบรายการนี้ใช่ไหม?")) return;
        try {
            setSaving(true);
            const ok = await tryDeleteEndpoints(it.id, it.note);
            if (!ok) throw new Error("ลบไม่สำเร็จ");
            await loadExpenses();
            setSelected(null);
        } catch (e: any) {
            alert(e?.message || "เกิดข้อผิดพลาดขณะลบ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="App summary-page">
                <div className="list-wrap"><div className="day-card">กำลังโหลดข้อมูล…</div></div>
                <BottomNav />
            </div>
        );
    }

    if (error) {
        return (
            <div className="App summary-page">
                <div className="list-wrap"><div className="day-card neg">{error}</div></div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="App summary-page">
            <div className="list-wrap">
                {entries.length === 0 && (
                    <section className="day-card">
                        <header className="day-header"><span className="day-date">ไม่มีรายการ</span></header>
                        <div className="day-body" />
                    </section>
                )}

                {entries.map((day) => (
                    <section
                        key={day.isoKey}
                        className="day-card is-clickable"
                        onClick={() => setSelected(day.items[0] ?? null)}
                        role="button"
                        aria-label={`ดูรายละเอียดของ ${day.label}`}
                    >
                        <header className="day-header">
                            <span className="day-date">{day.label}</span>
                            <span className="day-total">
                รวม:{" "}
                                <b className={day.total < 0 ? "neg" : "pos"}>
                  {signedAmountText(day.total)} ฿
                </b>
              </span>
                        </header>

                        <div className="day-body">
                            {day.items.map((it, idx) => (
                                <div
                                    key={it.id ?? idx}
                                    className="row clickable"
                                    onClick={(e) => { e.stopPropagation(); setSelected(it); setEditMode(false); }}
                                >
                                    <div className="row-left">
                                        <div className="row-avatar">
                                            <IconByKey name={it.iconKey} category={it.category} size={16} />
                                        </div>
                                        <div className="row-text">
                                            <div className="row-title">{it.category}</div>
                                            <div className="row-tag">{it.paymentMethod || "-"}</div>
                                        </div>
                                    </div>

                                    <div className={`row-amt ${it.amount < 0 ? "neg" : "pos"}`}>
                                        {signedAmountText(it.amount)}
                                    </div>

                                    {idx !== day.items.length - 1 && <div className="divider" aria-hidden="true" />}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {selected && (
                <div className="detail-overlay" onClick={() => { setSelected(null); setEditMode(false); }}>
                    <div className="detail-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <button className="detail-close" onClick={() => { setSelected(null); setEditMode(false); }} aria-label="ปิด">
                            <X size={20} />
                        </button>

                        <div className="detail-header">
                            <div className="detail-avatar">
                                <IconByKey name={selected.iconKey} category={selected.category} size={24} />
                            </div>
                            <h3 className="detail-title">{selected.category}</h3>
                        </div>

                        {!editMode && (
                            <div className="detail-body">
                                <div className="kv">
                                    <span className="k">ประเภท</span>
                                    <span className="v">{selected.type === "INCOME" ? "รายได้" : "ค่าใช้จ่าย"}</span>
                                </div>
                                <div className="kv">
                                    <span className="k">จำนวนเงิน</span>
                                    <span className={`v ${selected.amount < 0 ? "neg" : "pos"}`}>
                    {Math.abs(selected.amount).toLocaleString()} ฿
                  </span>
                                </div>
                                <div className="kv">
                                    <span className="k">วันที่</span>
                                    <span className="v">
                    {(() => {
                        const d = parseIsoDateToLocal(selected.isoDate);
                        return ddmmyyyy(d);
                    })()}
                  </span>
                                </div>
                                <div className="kv">
                                    <span className="k">เวลา</span>
                                    <span className="v">{(selected.datetimeLocal?.split("T")[1]) || "-"}</span>
                                </div>
                                <div className="kv">
                                    <span className="k">ประเภทการชำระ</span>
                                    <span className="v">{selected.paymentMethod || "-"}</span>
                                </div>
                                <div className="kv">
                                    <span className="k">โน้ต</span>
                                    <span className="v">{selected.note && selected.note.trim() !== "" ? selected.note : "-"}</span>
                                </div>
                                <div className="kv">
                                    <span className="k">สถานที่</span>
                                    <span className="v">{selected.location && selected.location.trim() !== "" ? selected.location : "-"}</span>
                                </div>

                                <div className="actions-row two" style={{ marginTop: 12 }}>
                                    <button className="btn primary" onClick={() => onEdit(selected)}>แก้ไข</button>
                                    <button className="btn danger" onClick={() => onDelete(selected)} disabled={saving}>
                                        {saving ? "กำลังลบ..." : "ลบ"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}