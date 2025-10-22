// src/pages/CustomOutcome.tsx
// @ts-nocheck
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./customoutcome.css";
import {
  Check,
  // Food & Drink
  Utensils, Pizza, Drumstick, Coffee, Beer, CupSoda, IceCream, Candy, Cake,
  // Travel
  Car, Bus, Bike, Plane, Train, Ship, Fuel, Map, MapPin,
  // Health
  Stethoscope, HeartPulse, Activity, Pill, Hospital, Ambulance,
  // Shopping / Style
  ShoppingCart, ShoppingBag, Gift, Tag, Shirt, CreditCard, SoapDispenserDroplet,
  // Work & Finance
  Briefcase, Laptop, Calculator, BarChart, Coins, Wallet,
  // Learning
  BookOpen, GraduationCap, Pencil,
  // Sports
  Dumbbell, Goal, Trophy, Volleyball,
  // Pets
  Dog, Cat, Fish, Bird,
  // Home / Family
  Home, Sofa, Bed, Wrench, Hammer,
  // Entertainment / Relax
  Gamepad, Music, Film, Popcorn, Clapperboard, Sprout, Search
} from "lucide-react";
import BottomNav from "./buttomnav";
import { useTempCategory } from "../TempCategoryContext";

type LucideIcon = React.ComponentType<{ className?: string }>;
type IconItem = { key: string; label: string; Icon: LucideIcon };

const ICON_SETS: Record<string, IconItem[]> = {
  "อาหาร & เครื่องดื่ม": [
    { key: "food", label: "อาหาร", Icon: Utensils },
    { key: "pizza", label: "พิซซ่า", Icon: Pizza },
    { key: "drumstick", label: "ไก่ทอด", Icon: Drumstick },
    { key: "coffee", label: "กาแฟ", Icon: Coffee },
    { key: "beer", label: "เบียร์", Icon: Beer },
    { key: "cupsoda", label: "โซดา", Icon: CupSoda },
    { key: "icecream", label: "ไอศกรีม", Icon: IceCream },
    { key: "candy", label: "ขนม", Icon: Candy },
    { key: "cake", label: "เค้ก", Icon: Cake },
  ],
  "การเดินทาง": [
    { key: "car", label: "รถยนต์", Icon: Car },
    { key: "bus", label: "รถบัส", Icon: Bus },
    { key: "bike", label: "จักรยาน", Icon: Bike },
    { key: "plane", label: "เครื่องบิน", Icon: Plane },
    { key: "train", label: "รถไฟ", Icon: Train },
    { key: "ship", label: "เรือ", Icon: Ship },
    { key: "fuel", label: "น้ำมัน", Icon: Fuel },
    { key: "map", label: "แผนที่", Icon: Map },
    { key: "mappin", label: "ปักหมุด", Icon: MapPin },
  ],
  "สุขภาพ & การแพทย์": [
    { key: "stethoscope", label: "หมอ", Icon: Stethoscope },
    { key: "heart", label: "สุขภาพ", Icon: HeartPulse },
    { key: "activity", label: "ออกกำลัง", Icon: Activity },
    { key: "pill", label: "ยา", Icon: Pill },
    { key: "hospital", label: "โรงพยาบาล", Icon: Hospital },
    { key: "ambulance", label: "ปฐมพยาบาล", Icon: Ambulance },
  ],
  "เสื้อผ้า & ช้อปปิ้ง": [
    { key: "cart", label: "ช้อปปิ้ง", Icon: ShoppingCart },
    { key: "bag", label: "กระเป๋า", Icon: ShoppingBag },
    { key: "gift", label: "ของขวัญ", Icon: Gift },
    { key: "tag", label: "ป้ายราคา", Icon: Tag },
    { key: "shirt", label: "เสื้อผ้า", Icon: Shirt },
    { key: "creditcard", label: "บัตรเครดิต", Icon: CreditCard },
    { key: "soap", label: "ของใช้", Icon: SoapDispenserDroplet },
  ],
  "งาน & การเงิน": [
    { key: "briefcase", label: "งาน", Icon: Briefcase },
    { key: "laptop", label: "คอม", Icon: Laptop },
    { key: "calculator", label: "คำนวณ", Icon: Calculator },
    { key: "barchart", label: "รายงาน", Icon: BarChart },
    { key: "coins", label: "เหรียญ", Icon: Coins },
    { key: "wallet", label: "กระเป๋าเงิน", Icon: Wallet },
  ],
  "การเรียนรู้": [
    { key: "book", label: "หนังสือ", Icon: BookOpen },
    { key: "graduation", label: "เรียน", Icon: GraduationCap },
    { key: "pencil", label: "เขียน", Icon: Pencil },
  ],
  "กีฬา & กิจกรรม": [
    { key: "dumbbell", label: "ฟิตเนส", Icon: Dumbbell },
    { key: "goal", label: "ฟุตบอล", Icon: Goal },
    { key: "trophy", label: "ถ้วยรางวัล", Icon: Trophy },
    { key: "volleyball", label: "วอลเลย์บอล", Icon: Volleyball },
  ],
  "สัตว์เลี้ยง": [
    { key: "dog", label: "สุนัข", Icon: Dog },
    { key: "cat", label: "แมว", Icon: Cat },
    { key: "fish", label: "ปลา", Icon: Fish },
    { key: "bird", label: "นก", Icon: Bird },
  ],
  "บ้าน & ครอบครัว": [
    { key: "home", label: "บ้าน", Icon: Home },
    { key: "sofa", label: "โซฟา", Icon: Sofa },
    { key: "bed", label: "เตียง", Icon: Bed },
    { key: "wrench", label: "ประแจ", Icon: Wrench },
    { key: "hammer", label: "ค้อน", Icon: Hammer },
  ],
  "บันเทิง & ผ่อนคลาย": [
    { key: "game", label: "เกม", Icon: Gamepad },
    { key: "music", label: "เพลง", Icon: Music },
    { key: "film", label: "หนัง", Icon: Film },
    { key: "popcorn", label: "ป๊อปคอร์น", Icon: Popcorn },
    { key: "clapper", label: "กองถ่าย", Icon: Clapperboard },
    { key: "sprout", label: "ปลูกต้นไม้", Icon: Sprout },
  ],
};

export default function CategoryCustom() {
  const nav = useNavigate();
  const { setTempCategory } = useTempCategory();

  const [picked, setPicked] = useState<IconItem | null>(null);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");

  const filteredSets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_SETS;

    const next: Record<string, IconItem[]> = {};
    Object.entries(ICON_SETS).forEach(([group, list]) => {
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
    const trimmed = name.trim();
    if (!picked || !trimmed) {
      alert("กรุณาเลือกไอคอนและตั้งชื่อ");
      return;
    }
    // ✅ ตั้งค่าหมวดชั่วคราวแล้วกลับไปหน้า Expense
    setTempCategory({ name: trimmed, iconKey: picked.key });
    nav(-1); // กลับหน้าก่อนหน้า (Expense)
  }

  return (
    <div className="cc-wrap">
      {/* Header */}
      <header className="cc-header">
        <h1 className="cc-title">OutcomeCustom</h1>
      </header>

      {/* Search bar */}
      <div className="cc-search">
        <Search className="cc-search-icon" />
        <input
          className="cc-search-input"
          placeholder="ค้นหาไอคอน… (พิมพ์เช่น กาแฟ, รถ, งาน, music)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="cc-search-clear" onClick={() => setQuery("")} aria-label="ล้างคำค้น">
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
            placeholder="ชื่อหมวดหมู่"
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

      {/* Library (กรองตามคำค้น) */}
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
                    onClick={() => setPicked(item)}
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
