// src/pages/customincome.tsx
// @ts-nocheck
import { useMemo, useState } from "react";
import "./customincome.css";
import {
  // UI
  Check, Search,

  // เงินเดือน & งานประจำ
  Briefcase, BarChart, Clock, Wallet, ShieldCheck,

  // งานเสริม & ฟรีแลนซ์
  Laptop, UserCheck, BookOpen, Camera, Bike, Car, PenTool, Code, Banknote,

  // การลงทุน & ดอกผล
  Coins, PiggyBank, LineChart, FileText, Layers, TrendingUp,

  // ค่าเช่า & ทรัพย์สิน
  Home, Bed, Building, Truck, Package,

  // ค้าขาย & ออนไลน์
  ShoppingBag, Store, Boxes, Tent, CreditCard, Ticket,

  // ครีเอเตอร์ & ลิขสิทธิ์
  Video, Mic, Radio, Music, Film, Gamepad,

  // ทุน/สนับสนุน
  ClipboardList, ClipboardCheck, Trophy, GraduationCap,

  // ของขวัญ & อื่น ๆ
  Gift, Coffee, Star, Gem, HandCoins,

  // Crypto & Digital
  Bitcoin, CircuitBoard, Image, Cloud, Lock,

  // Passive
  Link, Megaphone, FileBadge, Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "./buttomnav";

type LucideIcon = React.ComponentType<{ className?: string }>;
type IconItem = { key: string; label: string; Icon: LucideIcon; iconName: string };

// ====== ชุดไอคอนรายได้ (เพิ่ม/ลบได้ตามต้องการ) ======
const ICON_SETS_INCOME: Record<string, IconItem[]> = {
  "เงินเดือน & งานประจำ": [
    { key: "salary",     label: "เงินเดือน",          Icon: Briefcase,   iconName: "Briefcase" },
    { key: "bonus",      label: "โบนัส",              Icon: BarChart,    iconName: "BarChart" },
    { key: "overtime",   label: "OT",                 Icon: Clock,       iconName: "Clock" },
    { key: "allowance",  label: "สวัสดิการ",         Icon: Wallet,      iconName: "Wallet" },
    { key: "insurance",  label: "ค่าชดเชย/ประกัน",   Icon: ShieldCheck, iconName: "ShieldCheck" },
  ],
  "งานเสริม & ฟรีแลนซ์": [
    { key: "freelance",  label: "ฟรีแลนซ์",          Icon: Laptop,      iconName: "Laptop" },
    { key: "consult",    label: "ที่ปรึกษา",         Icon: UserCheck,   iconName: "UserCheck" },
    { key: "tutor",      label: "ติวเตอร์",          Icon: BookOpen,    iconName: "BookOpen" },
    { key: "photo",      label: "ถ่ายภาพ",           Icon: Camera,      iconName: "Camera" },
    { key: "delivery",   label: "ไรเดอร์",           Icon: Bike,        iconName: "Bike" },
    { key: "driver",     label: "ขับรถ",             Icon: Car,         iconName: "Car" },
    { key: "design",     label: "งานดีไซน์",         Icon: PenTool,     iconName: "PenTool" },
    { key: "dev",        label: "โปรแกรมเมอร์",      Icon: Code,        iconName: "Code" },
    { key: "work",       label: "ทำงาน",             Icon: Banknote,    iconName: "Banknote" },
  ],
  "การลงทุน & ดอกผล": [
    { key: "interest",   label: "ดอกเบี้ย",          Icon: Coins,       iconName: "Coins" },
    { key: "dividend",   label: "เงินปันผล",         Icon: PiggyBank,   iconName: "PiggyBank" },
    { key: "stock",      label: "หุ้น",               Icon: LineChart,   iconName: "LineChart" },
    { key: "bond",       label: "พันธบัตร",          Icon: FileText,    iconName: "FileText" },
    { key: "fund",       label: "กองทุนรวม",         Icon: Layers,      iconName: "Layers" },
    { key: "profit",     label: "กำไรซื้อขาย",       Icon: TrendingUp,  iconName: "TrendingUp" },
  ],
  "ค่าเช่า & ทรัพย์สิน": [
    { key: "rent_house", label: "ค่าเช่าบ้าน",       Icon: Home,        iconName: "Home" },
    { key: "rent_room",  label: "ค่าเช่าห้อง",       Icon: Bed,         iconName: "Bed" },
    { key: "rent_office",label: "ค่าเช่าสำนักงาน",  Icon: Building,    iconName: "Building" },
    { key: "rent_car",   label: "ค่าเช่ารถ",         Icon: Truck,       iconName: "Truck" },
    { key: "rent_asset", label: "เช่าทรัพย์สิน",     Icon: Package,     iconName: "Package" },
  ],
  "ค้าขาย & ออนไลน์": [
    { key: "online_sale",label: "ขายออนไลน์",        Icon: ShoppingBag, iconName: "ShoppingBag" },
    { key: "retail",     label: "ค้าปลีก",           Icon: Store,       iconName: "Store" },
    { key: "wholesale",  label: "ค้าส่ง",            Icon: Boxes,       iconName: "Boxes" },
    { key: "market",     label: "ตลาดนัด",           Icon: Tent,        iconName: "Tent" },
    { key: "cashback",   label: "Cashback",          Icon: CreditCard,  iconName: "CreditCard" },
    { key: "voucher",    label: "Voucher",           Icon: Ticket,      iconName: "Ticket" },
  ],
  "ครีเอเตอร์ & ลิขสิทธิ์": [
    { key: "youtube",    label: "YouTube Ads",       Icon: Video,       iconName: "Video" },
    { key: "twitch",     label: "Live Stream",       Icon: Mic,         iconName: "Mic" },
    { key: "podcast",    label: "Podcast",           Icon: Radio,       iconName: "Radio" },
    { key: "royalty_music", label: "เพลง",           Icon: Music,       iconName: "Music" },
    { key: "royalty_film",  label: "หนัง/ละคร",      Icon: Film,        iconName: "Film" },
    { key: "royalty_game",  label: "เกม",            Icon: Gamepad,     iconName: "Gamepad" },
  ],
  "ทุนการศึกษา & สนับสนุน": [
    { key: "scholarship",label: "ทุนการศึกษา",      Icon: GraduationCap, iconName: "GraduationCap" },
    { key: "stipend",    label: "เบี้ยเลี้ยง",      Icon: ClipboardList, iconName: "ClipboardList" },
    { key: "grant",      label: "Grant/ทุนวิจัย",   Icon: ClipboardCheck,iconName: "ClipboardCheck" },
    { key: "competition",label: "ชนะประกวด",        Icon: Trophy,        iconName: "Trophy" },
  ],
  "ของขวัญ & อื่น ๆ": [
    { key: "gift_money", label: "อั่งเปา/ของขวัญ",  Icon: Gift,        iconName: "Gift" },
    { key: "tips",       label: "ทิป",               Icon: Coffee,      iconName: "Coffee" },
    { key: "lottery",    label: "ลอตเตอรี่",         Icon: Star,        iconName: "Star" },
    { key: "inheritance",label: "มรดก",             Icon: Gem,         iconName: "Gem" },
    { key: "hand_coins", label: "ค่าขนม",           Icon: HandCoins,   iconName: "HandCoins" },
  ],
  "Crypto & Digital Assets": [
    { key: "btc",        label: "Bitcoin",           Icon: Bitcoin,     iconName: "Bitcoin" },
    { key: "eth",        label: "Ethereum",          Icon: CircuitBoard,iconName: "CircuitBoard" },
    { key: "nft",        label: "NFT",               Icon: Image,       iconName: "Image" },
    { key: "airdrop",    label: "Airdrop",           Icon: Cloud,       iconName: "Cloud" },
    { key: "staking",    label: "Staking",           Icon: Lock,        iconName: "Lock" },
  ],
  "Passive Income & Royalty": [
    { key: "affiliate",  label: "Affiliate",         Icon: Link,        iconName: "Link" },
    { key: "ads",        label: "โฆษณา",            Icon: Megaphone,   iconName: "Megaphone" },
    { key: "license",    label: "License",           Icon: FileBadge,   iconName: "FileBadge" },
    { key: "membership", label: "สมาชิก/Subscription", Icon: Users,     iconName: "Users" },
  ],
};

export default function IncomeCustom() {
  const navigate = useNavigate();

  const [picked, setPicked] = useState<IconItem | null>(null);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");

  const filteredSets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_SETS_INCOME;

    const next: Record<string, IconItem[]> = {};
    Object.entries(ICON_SETS_INCOME).forEach(([group, list]) => {
      if (group.toLowerCase().includes(q)) {
        next[group] = list;
        return;
      }
      const hit = list.filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.key.toLowerCase().includes(q)
      );
      if (hit.length) next[group] = hit;
    });
    return next;
  }, [query]);

  function handleConfirm() {
    if (!picked || !name.trim()) {
      alert("กรุณาเลือกไอคอนและตั้งชื่อ");
      return;
    }
    // ✅ ส่งกลับไปหน้า Income พร้อม state
    navigate("/income", {
      state: {
        customIncome: {
          label: name.trim(),
          icon: picked.iconName, // ต้องตรงกับ ICON_MAP ในหน้า Income
        },
      },
      replace: true,
    });
  }

  return (
    <div className="cc-wrap">
      {/* Header */}
      <header className="cc-header">
        <h1 className="cc-title">Custom Income</h1>
      </header>

      {/* Search bar */}
      <div className="cc-search">
        <Search className="cc-search-icon" />
        <input
          className="cc-search-input"
          placeholder="ค้นหาไอคอนรายได้… (เช่น เงินเดือน, ฟรีแลนซ์, ปันผล)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="cc-search-clear"
            onClick={() => setQuery("")}
            aria-label="ล้างคำค้น"
          >
            ×
          </button>
        )}
      </div>

      {/* Creator */}
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
            maxLength={32}
          />
          <div className="cc-underline" />
        </div>

        <button className="cc-confirm" onClick={handleConfirm} aria-label="ยืนยัน">
          <Check className="cc-checkicon" />
        </button>
      </section>

      {/* Library */}
      <section className="cc-library">
        {Object.keys(filteredSets).length === 0 ? (
          <p className="cc-noresult">ไม่พบไอคอนที่ตรงกับ “{query}”</p>
        ) : (
          Object.entries(filteredSets).map(([group, list]) => (
            <div key={group} className="cc-group">
              <h3 className="cc-group-title">{group}</h3>
              <div className="cc-grid">
                {list.map((item) => (
                  <button
                    key={item.key}
                    className={`cc-chip ${picked?.key === item.key ? "active" : ""}`}
                    onClick={() => {
                      setPicked(item);
                    }}
                    title={item.label}
                  >
                    <item.Icon className="cc-icon" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <BottomNav />
    </div>
  );
}
