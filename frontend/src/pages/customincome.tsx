// src/pages/customincome.tsx
// @ts-nocheck
import React, { useMemo, useState } from "react";
import "./customincome.css";
import {
    Check,
    Search,
    Briefcase,
    BarChart,
    Clock,
    ChevronLeft,
    Wallet,
    ShieldCheck,
    Laptop,
    UserCheck,
    BookOpen,
    Camera,
    Bike,
    Car,
    PenTool,
    Code,
    Banknote,
    Coins,
    PiggyBank,
    LineChart,
    FileText,
    Layers,
    TrendingUp,
    Home,
    Bed,
    Building,
    Truck,
    Package,
    ShoppingBag,
    Store,
    Boxes,
    Tent,
    CreditCard,
    Ticket,
    Video,
    Mic,
    Radio,
    Music,
    Film,
    Gamepad,
    ClipboardList,
    ClipboardCheck,
    Trophy,
    GraduationCap,
    Gift,
    Coffee,
    Star,
    Gem,
    HandCoins,
    Bitcoin,
    CircuitBoard,
    Image,
    Cloud,
    Lock,
    Link,
    Megaphone,
    FileBadge,
    Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "./buttomnav";

type LucideIcon = React.ComponentType<{ className?: string }>;
type IconItem = { key: string; label: string; Icon: LucideIcon; iconName: string };

export const ICON_SETS_INCOME: Record<string, IconItem[]> = {
    "เงินเดือน & งานประจำ": [
        { key: "salary", label: "เงินเดือน", Icon: Briefcase, iconName: "Briefcase" },
        { key: "bonus", label: "โบนัส", Icon: BarChart, iconName: "BarChart" },
        { key: "overtime", label: "OT", Icon: Clock, iconName: "Clock" },
        { key: "allowance", label: "สวัสดิการ", Icon: Wallet, iconName: "Wallet" },
        { key: "insurance", label: "ค่าชดเชย/ประกัน", Icon: ShieldCheck, iconName: "ShieldCheck" },
    ],
    "งานเสริม & ฟรีแลนซ์": [
        { key: "freelance", label: "ฟรีแลนซ์", Icon: Laptop, iconName: "Laptop" },
        { key: "consult", label: "ที่ปรึกษา", Icon: UserCheck, iconName: "UserCheck" },
        { key: "tutor", label: "ติวเตอร์", Icon: BookOpen, iconName: "BookOpen" },
        { key: "photo", label: "ถ่ายภาพ", Icon: Camera, iconName: "Camera" },
        { key: "delivery", label: "ไรเดอร์", Icon: Bike, iconName: "Bike" },
        { key: "driver", label: "ขับรถ", Icon: Car, iconName: "Car" },
        { key: "design", label: "งานดีไซน์", Icon: PenTool, iconName: "PenTool" },
        { key: "dev", label: "โปรแกรมเมอร์", Icon: Code, iconName: "Code" },
        { key: "work", label: "ทำงาน", Icon: Banknote, iconName: "Banknote" },
    ],
    "การลงทุน & ดอกผล": [
        { key: "interest", label: "ดอกเบี้ย", Icon: Coins, iconName: "Coins" },
        { key: "dividend", label: "เงินปันผล", Icon: PiggyBank, iconName: "PiggyBank" },
        { key: "stock", label: "หุ้น", Icon: LineChart, iconName: "LineChart" },
        { key: "bond", label: "พันธบัตร", Icon: FileText, iconName: "FileText" },
        { key: "fund", label: "กองทุนรวม", Icon: Layers, iconName: "Layers" },
        { key: "profit", label: "กำไรซื้อขาย", Icon: TrendingUp, iconName: "TrendingUp" },
    ],
    "ค่าเช่า & ทรัพย์สิน": [
        { key: "rent_house", label: "ค่าเช่าบ้าน", Icon: Home, iconName: "Home" },
        { key: "rent_room", label: "ค่าเช่าห้อง", Icon: Bed, iconName: "Bed" },
        { key: "rent_office", label: "ค่าเช่าสำนักงาน", Icon: Building, iconName: "Building" },
        { key: "rent_car", label: "ค่าเช่ารถ", Icon: Truck, iconName: "Truck" },
        { key: "rent_asset", label: "เช่าทรัพย์สิน", Icon: Package, iconName: "Package" },
    ],
    "ค้าขาย & ออนไลน์": [
        { key: "online_sale", label: "ขายออนไลน์", Icon: ShoppingBag, iconName: "ShoppingBag" },
        { key: "retail", label: "ค้าปลีก", Icon: Store, iconName: "Store" },
        { key: "wholesale", label: "ค้าส่ง", Icon: Boxes, iconName: "Boxes" },
        { key: "market", label: "ตลาดนัด", Icon: Tent, iconName: "Tent" },
        { key: "cashback", label: "Cashback", Icon: CreditCard, iconName: "CreditCard" },
        { key: "voucher", label: "Voucher", Icon: Ticket, iconName: "Ticket" },
    ],
    "ครีเอเตอร์ & ลิขสิทธิ์": [
        { key: "youtube", label: "YouTube Ads", Icon: Video, iconName: "Video" },
        { key: "twitch", label: "Live Stream", Icon: Mic, iconName: "Mic" },
        { key: "podcast", label: "Podcast", Icon: Radio, iconName: "Radio" },
        { key: "royalty_music", label: "เพลง", Icon: Music, iconName: "Music" },
        { key: "royalty_film", label: "หนัง/ละคร", Icon: Film, iconName: "Film" },
        { key: "royalty_game", label: "เกม", Icon: Gamepad, iconName: "Gamepad" },
    ],
    "ทุนการศึกษา & สนับสนุน": [
        { key: "scholarship", label: "ทุนการศึกษา", Icon: GraduationCap, iconName: "GraduationCap" },
        { key: "stipend", label: "เบี้ยเลี้ยง", Icon: ClipboardList, iconName: "ClipboardList" },
        { key: "grant", label: "Grant/ทุนวิจัย", Icon: ClipboardCheck, iconName: "ClipboardCheck" },
        { key: "competition", label: "ชนะประกวด", Icon: Trophy, iconName: "Trophy" },
    ],
    "ของขวัญ & อื่น ๆ": [
        { key: "gift_money", label: "อั่งเปา/ของขวัญ", Icon: Gift, iconName: "Gift" },
        { key: "tips", label: "ทิป", Icon: Coffee, iconName: "Coffee" },
        { key: "lottery", label: "ลอตเตอรี่", Icon: Star, iconName: "Star" },
        { key: "inheritance", label: "มรดก", Icon: Gem, iconName: "Gem" },
        { key: "hand_coins", label: "ค่าขนม", Icon: HandCoins, iconName: "HandCoins" },
    ],
    "Crypto & Digital Assets": [
        { key: "btc", label: "Bitcoin", Icon: Bitcoin, iconName: "Bitcoin" },
        { key: "eth", label: "Ethereum", Icon: CircuitBoard, iconName: "CircuitBoard" },
        { key: "nft", label: "NFT", Icon: Image, iconName: "Image" },
        { key: "airdrop", label: "Airdrop", Icon: Cloud, iconName: "Cloud" },
        { key: "staking", label: "Staking", Icon: Lock, iconName: "Lock" },
    ],
    "Passive Income & Royalty": [
        { key: "affiliate", label: "Affiliate", Icon: Link, iconName: "Link" },
        { key: "ads", label: "โฆษณา", Icon: Megaphone, iconName: "Megaphone" },
        { key: "license", label: "License", Icon: FileBadge, iconName: "FileBadge" },
        { key: "membership", label: "สมาชิก/Subscription", Icon: Users, iconName: "Users" },
    ],
};

export const CUSTOM_ICONS = Object.fromEntries(
    Object.values(ICON_SETS_INCOME)
        .flat()
        .map((it) => [it.iconName, it.Icon])
);

export function IncomeCustom() {
    const navigate = useNavigate();
    const [picked, setPicked] = useState<IconItem | null>(null);
    const [name, setName] = useState("");
    const [query, setQuery] = useState("");

    // ✅ ปรับให้ค้นหาได้ทั้ง "ชื่อกลุ่ม", "label", "key" และ "iconName"
    const filteredSets = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ICON_SETS_INCOME;

        const next: Record<string, IconItem[]> = {};
        Object.entries(ICON_SETS_INCOME).forEach(([group, list]) => {
            const groupHit = group.toLowerCase().includes(q); // ถ้าตรงชื่อกลุ่ม แสดงทั้งกลุ่ม
            if (groupHit) {
                next[group] = list;
                return;
            }

            const hit = list.filter(
                (it) =>
                    it.label.toLowerCase().includes(q) ||
                    it.key.toLowerCase().includes(q) ||
                    (it.iconName ?? "").toLowerCase().includes(q)
            );
            if (hit.length) next[group] = hit;
        });
        return next;
    }, [query]);

    const handleConfirm = () => {
        if (!picked || !name.trim()) return alert("กรุณาเลือกไอคอนและตั้งชื่อ");
        navigate("/income", {
            state: { customIncome: { label: name.trim(), icon: picked.iconName } },
            replace: true,
        });
    };

    return (
        <div className="cc-wrap">
            <header className="cc-header">
                <button className="cc-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="cc-title">Custom Income</h1>
            </header>

            <div className="cc-search">
                <Search className="cc-search-icon" />
                <input
                    className="cc-search-input"
                    placeholder="ค้นหา..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                    <button className="cc-search-clear" onClick={() => setQuery("")}>
                        ×
                    </button>
                )}
            </div>

            <section className="cc-creator">
                <div className="cc-picked">
                    {picked ? <picked.Icon className="cc-picked-icon" /> : <span>?</span>}
                </div>
                <div className="cc-namefield">
                    <input
                        className="cc-nameinput"
                        placeholder="ชื่อหมวดรายได้"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className="cc-underline" />
                </div>
                <button className="cc-confirm" onClick={handleConfirm}>
                    <Check className="cc-checkicon" />
                </button>
            </section>

            <section className="cc-library">
                {Object.entries(filteredSets).map(([group, list]) => (
                    <div key={group} className="cc-group" data-cy={`group-${group.replace(/\s|&/g, "")}`}>
                        <h3 className="cc-group-title">{group}</h3>
                        <div className="cc-grid">
                            {list.map((item) => (
                                <button
                                    key={item.key}
                                    className={`cc-chip ${picked?.key === item.key ? "active" : ""}`}
                                    onClick={() => setPicked(item)}
                                    title={item.label}                 // ✅ ให้ Cypress หาได้ด้วย title
                                    aria-label={item.label}            // ✅ ช่วยด้าน a11y
                                    data-cy={`icon-${item.key}`}       // ✅ selector ที่เสถียร
                                >
                                    <item.Icon className="cc-icon" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            <BottomNav />
        </div>
    );
}

export default IncomeCustom;
