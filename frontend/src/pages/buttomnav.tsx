import { Link, useLocation } from "react-router-dom";
import { Calculator, Home, BarChart3, MoreHorizontal } from "lucide-react";
import "./buttomnav.css";

export default function BottomNav() {
    const { pathname } = useLocation();
    const is = (p: string) => (pathname === p ? "active" : "");

    return (
        <div className="bottom-nav" role="navigation" aria-label="bottom navigation">
            <Link to="/expense" className={`nav-button ${is("/expense")}`} aria-label="บันทึกค่าใช้จ่าย">
                <Calculator size={24} />
            </Link>

            <Link to="/home" className={`nav-button ${is("/home")}`} aria-label="หน้าหลัก">
                <Home size={24} />
            </Link>

            <Link to="/month" className={`nav-button ${is("/month")}`} aria-label="สรุปรายเดือน">
                <BarChart3 size={24} />
            </Link>

            {/* ใหม่: ปุ่ม ... */}
            <Link to="/more" className={`nav-button ${is("/More")}`} aria-label="เมนูเพิ่มเติม">
                <MoreHorizontal size={24} />
            </Link>
        </div>
    );
}
