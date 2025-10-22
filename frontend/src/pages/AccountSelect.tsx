import { useEffect, useMemo, useState } from "react";
import "./AccountSelect.css";
import BottomNav from "./buttomnav";
import { useNavigate } from "react-router-dom";
import { usePaymentMethod } from "../PaymentMethodContext";
import { Building2, Banknote, Landmark, CreditCard, Wallet, PiggyBank, Coins } from "lucide-react";

type FilterKey = "ทั้งหมด" | "เงินสด" | "ธนาคาร" | "บัตรเครดิต";
type AccountType = "เงินสด" | "ธนาคาร" | "บัตรเครดิต";
type StoredAccount = { name: string; amount: number; iconKey?: string; type?: AccountType };
type AccountItem = {
    id: string;
    label: string;
    type: AccountType;
    favorite: boolean;
    favoritedAt?: number;
    iconKey?: string;
    amount: number;
};

const OPTIONS: FilterKey[] = ["ทั้งหมด", "เงินสด", "ธนาคาร", "บัตรเครดิต"];
const FAV_KEY = "accountFavs";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    bank: Building2,
    banknote: Banknote,
    landmark: Landmark,
    credit: CreditCard,
    wallet: Wallet,
    piggy: PiggyBank,
    coins: Coins,
};

function loadAccounts(): StoredAccount[] {
    try {
        const raw = localStorage.getItem("accounts");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}
function loadFavs(): Record<string, { favorite: boolean; favoritedAt?: number }> {
    try {
        const raw = localStorage.getItem(FAV_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        return obj && typeof obj === "object" ? obj : {};
    } catch { return {}; }
}
function saveFavs(map: Record<string, { favorite: boolean; favoritedAt?: number }>) {
    localStorage.setItem(FAV_KEY, JSON.stringify(map));
}
function getPendingAmount(): number {
    const a =
        (typeof localStorage !== "undefined" && localStorage.getItem("pendingExpenseAmount")) ||
        (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pendingExpenseAmount")) ||
        "0";
    const n = Number(String(a).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
}

export default function AccountSelect() {
    const [filter, setFilter] = useState<FilterKey>("ทั้งหมด");
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<AccountItem[]>([]);
    const navigate = useNavigate();
    const { setPayment } = usePaymentMethod();

    const rebuild = () => {
        const accs = loadAccounts();
        const favs = loadFavs();
        const list: AccountItem[] = accs.map((a, idx) => {
            const t = (a.type as AccountType) || "เงินสด";
            const id = `${t}:${a.name}:${idx}`;
            const fav = favs[id]?.favorite ?? false;
            return {
                id,
                label: a.name,
                type: t,
                favorite: fav,
                favoritedAt: favs[id]?.favoritedAt,
                iconKey: a.iconKey,
                amount: typeof a.amount === "number" && !Number.isNaN(a.amount) ? a.amount : 0,
            };
        });
        setItems(list);
    };

    useEffect(() => {
        rebuild();
        const onFocus = () => rebuild();
        const onStorage = (e: StorageEvent) => { if (e.key === "accounts" || e.key === FAV_KEY) rebuild(); };
        window.addEventListener("focus", onFocus);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [filter]);

    const toggleFavorite = (id: string) => {
        setItems(prev => {
            const now = Date.now();
            const next = prev.map(it => it.id === id ? { ...it, favorite: !it.favorite, favoritedAt: !it.favorite ? now : undefined } : it);
            const favs = loadFavs();
            const f = next.find(x => x.id === id);
            if (f) { favs[id] = { favorite: f.favorite, favoritedAt: f.favoritedAt }; saveFavs(favs); }
            return next;
        });
    };

    const listView = useMemo(() => {
        const filtered = filter === "ทั้งหมด" ? items : items.filter(it => it.type === filter);
        const favRank = (a: AccountItem) => (a.favorite ? 0 : 1);
        const favOrder = (a?: number, b?: number) => {
            if (a == null && b == null) return 0;
            if (a == null) return 1;
            if (b == null) return -1;
            return a - b;
        };
        return [...filtered].sort((a, b) => {
            const r = favRank(a) - favRank(b);
            if (r !== 0) return r;
            const t = favOrder(a.favoritedAt, b.favoritedAt);
            if (t !== 0) return t;
            return a.label.localeCompare(b.label, "th");
        });
    }, [items, filter]);

    const pick = (it: AccountItem) => {
        const need = getPendingAmount();
        if (need > it.amount) {
            alert(`ยอดเงินในบัญชี "${it.label}" มี ${it.amount.toLocaleString("th-TH")} บาท\nแต่ต้องจ่าย ${need.toLocaleString("th-TH")} บาท\nไม่สามารถเลือกบัญชีนี้ได้`);
            return;
        }
        setPayment({ id: it.id, name: it.label, favorite: it.favorite });
        if (window.history.length > 1) navigate(-1);
        else navigate("/expense", { replace: true });
    };

    const iconOf = (key?: string) => ICONS[key || "bank"] || Building2;

    return (
        <div className="screen">
            <div className="filter">
                <button
                    type="button"
                    className="filter__button"
                    onClick={() => setOpen(o => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                >
                    <span className="filter__text">{filter}</span>
                    <span className={`filter__chev ${open ? "up" : ""}`}>▾</span>
                </button>
                {open && (
                    <ul className="filter__menu" role="listbox">
                        {OPTIONS.map((k, i) => (
                            <li key={k}>
                                {i === 0 ? null : <div className="filter__divider" />}
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={filter === k}
                                    className="filter__option"
                                    onClick={() => { setFilter(k); setOpen(false); }}
                                >
                                    {k}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="list list--cards">
                {listView.length === 0 ? (
                    <div className="empty">ไม่มีรายการ</div>
                ) : (
                    listView.map(it => {
                        const Icon = iconOf(it.iconKey);
                        return (
                            <button key={it.id} className="card mini" onClick={() => pick(it)}>
                                <div className="mini__left">
                                    <div className="mini__icon"><Icon className="icon" /></div>
                                    <div className="mini__title">{it.label}</div>
                                </div>
                                <Star active={it.favorite} onClick={e => { e.stopPropagation(); toggleFavorite(it.id); }} />
                            </button>
                        );
                    })
                )}
            </div>

            <BottomNav />
        </div>
    );
}

function Star({ active, onClick }: { active: boolean; onClick: (e: React.MouseEvent) => void }) {
    return (
        <span className={`star ${active ? "on" : "off"}`} onClick={onClick} aria-label={active ? "Unfavorite" : "Favorite"}>
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={active ? 0 : 1.6}
            strokeLinejoin="round"
        />
      </svg>
    </span>
    );
}
