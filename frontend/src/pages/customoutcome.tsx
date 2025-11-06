// src/pages/customoutcome.tsx
// @ts-nocheck
import React, { useMemo, useState } from "react";
import "./customoutcome.css";
import {
    Check, Search,
    Utensils, Coffee, ChevronLeft, ShoppingCart, ShoppingBag, Tag,
    Bus, Train, Car, Fuel, Home, HeartPulse, CreditCard, Wallet, MapPin,
    Beer, Pizza, Shirt, Gamepad2, PawPrint, Dumbbell, Book, Sofa, Wrench,
    Briefcase, Scissors, Smartphone, Tv, WashingMachine, Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "./buttomnav";

type LucideIcon = React.ComponentType<{ className?: string }>;
type IconItem = { key: string; label: string; Icon: LucideIcon; iconName: string };

export const ICON_SETS_OUTCOME: Record<string, IconItem[]> = {
    "อาหาร & เครื่องดื่ม": [
        { key: "food", label: "อาหาร", Icon: Utensils, iconName: "Utensils" },
        { key: "drink", label: "เครื่องดื่ม", Icon: Beer, iconName: "Beer" },
        { key: "coffee", label: "กาแฟ/คาเฟ่", Icon: Coffee, iconName: "Coffee" },
        { key: "pizza", label: "ฟาสต์ฟู้ด", Icon: Pizza, iconName: "Pizza" },
    ],
    "เดินทาง & คมนาคม": [
        { key: "bus", label: "รถเมล์", Icon: Bus, iconName: "Bus" },
        { key: "train", label: "รถไฟ/รถไฟฟ้า", Icon: Train, iconName: "Train" },
        { key: "car", label: "แท็กซี่/รถส่วนตัว", Icon: Car, iconName: "Car" },
        { key: "fuel", label: "ค่าน้ำมัน", Icon: Fuel, iconName: "Fuel" },
        { key: "map", label: "ท่องเที่ยว", Icon: MapPin, iconName: "MapPin" },
    ],
    "ช้อปปิ้ง & ไลฟ์สไตล์": [
        { key: "shopping", label: "ช้อปปิ้ง", Icon: ShoppingBag, iconName: "ShoppingBag" },
        { key: "grocery", label: "ซูเปอร์มาร์เก็ต", Icon: ShoppingCart, iconName: "ShoppingCart" },
        { key: "clothes", label: "เสื้อผ้า", Icon: Shirt, iconName: "Shirt" },
        { key: "tag", label: "คูปอง/ส่วนลด", Icon: Tag, iconName: "Tag" },
    ],
    "บ้าน & สาธารณูปโภค": [
        { key: "rent", label: "ค่าเช่าบ้าน", Icon: Home, iconName: "Home" },
        { key: "furniture", label: "เฟอร์นิเจอร์", Icon: Sofa, iconName: "Sofa" },
        { key: "repair", label: "ซ่อมแซมบ้าน", Icon: Wrench, iconName: "Wrench" },
        { key: "utilities", label: "ค่าน้ำ/ไฟ/เน็ต", Icon: CreditCard, iconName: "CreditCard" },
    ],
    "สุขภาพ & ฟิตเนส": [
        { key: "health", label: "สุขภาพ/โรงพยาบาล", Icon: HeartPulse, iconName: "HeartPulse" },
        { key: "gym", label: "ฟิตเนส/กีฬา", Icon: Dumbbell, iconName: "Dumbbell" },
        { key: "book", label: "การศึกษา/หนังสือ", Icon: Book, iconName: "Book" },
    ],
    "บริการ & งานช่าง": [
        { key: "haircut", label: "ตัดผม/สปา", Icon: Scissors, iconName: "Scissors" },
        { key: "service", label: "บริการทั่วไป", Icon: Briefcase, iconName: "Briefcase" },
        { key: "cleaning", label: "ทำความสะอาด", Icon: WashingMachine, iconName: "WashingMachine" },
    ],
    "ความบันเทิง & อุปกรณ์": [
        { key: "games", label: "เกม/ความบันเทิง", Icon: Gamepad2, iconName: "Gamepad2" },
        { key: "phone", label: "มือถือ/แกดเจ็ต", Icon: Smartphone, iconName: "Smartphone" },
        { key: "tv", label: "ทีวี/สตรีมมิ่ง", Icon: Tv, iconName: "Tv" },
    ],
    "การเงิน & อื่น ๆ": [
        { key: "wallet", label: "เงินสด", Icon: Wallet, iconName: "Wallet" },
        { key: "card", label: "บัตรเครดิต", Icon: CreditCard, iconName: "CreditCard" },
        { key: "pets", label: "สัตว์เลี้ยง", Icon: PawPrint, iconName: "PawPrint" },
        { key: "world", label: "บริจาค/สังคม", Icon: Globe, iconName: "Globe" },
    ],
};

export const CUSTOM_ICONS = Object.fromEntries(
    Object.values(ICON_SETS_OUTCOME).flat().map((it) => [it.iconName, it.Icon])
);

export function OutcomeCustom() {
    const navigate = useNavigate();
    const [picked, setPicked] = useState<IconItem | null>(null);
    const [name, setName] = useState("");
    const [query, setQuery] = useState("");

    const filteredSets = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ICON_SETS_OUTCOME;
        const next: Record<string, IconItem[]> = {};
        Object.entries(ICON_SETS_OUTCOME).forEach(([group, list]) => {
            if (group.toLowerCase().includes(q)) {
                next[group] = list;
                return;
            }
            const hit = list.filter(
                (it) =>
                    it.label.toLowerCase().includes(q) ||
                    it.key.toLowerCase().includes(q) ||
                    it.iconName.toLowerCase().includes(q)
            );
            if (hit.length) next[group] = hit;
        });
        return next;
    }, [query]);

    const handleConfirm = () => {
        if (!picked || !name.trim()) {
            alert("กรุณาเลือกไอคอนและตั้งชื่อ");
            return;
        }
        const payload = { label: name.trim(), icon: picked.iconName };
        try {
            sessionStorage.setItem("customOutcome", JSON.stringify(payload));
            sessionStorage.setItem("customOutcomeLabel", payload.label);
            sessionStorage.setItem("customOutcomeIcon", payload.icon);
            window.dispatchEvent(new CustomEvent("customOutcomeSaved", { detail: payload }));
        } catch {}
        navigate("/expense", {
            replace: true,
            state: { customOutcome: payload, custom: payload },
        });
    };

    return (
        <div className="cc-wrap">
            <header className="cc-header">
                <button className="cc-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="cc-title">Custom Outcome</h1>
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
                        placeholder="ชื่อหมวดรายจ่าย"
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
                    <div key={group} className="cc-group">
                        <h3 className="cc-group-title">{group}</h3>
                        <div className="cc-grid">
                            {list.map((item) => (
                                <button
                                    key={item.key}
                                    className={`cc-chip ${picked?.key === item.key ? "active" : ""}`}
                                    onClick={() => setPicked(item)}
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

export default OutcomeCustom;
