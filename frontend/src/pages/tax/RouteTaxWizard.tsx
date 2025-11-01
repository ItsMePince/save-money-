import { useNavigate } from "react-router-dom";
import TaxWizardModal from "./TaxWizardModal";

export default function RouteTaxWizard() {
  const navigate = useNavigate();
  return (
    <TaxWizardModal
      isOpen={true}                 // เข้าหน้านี้ให้เปิดโมดัลเลย
      onClose={() => navigate("/more")} // กด X แล้วกลับหน้า More
    />
  );
}