import React, { useState, useEffect } from 'react';
import './AddTransaction.css';

interface AddTransactionProps {
  onCancel: () => void;
  onSubmit: (data: TransactionFormData) => void;
  initialData?: TransactionFormData;
  isEditing?: boolean;
}

export interface TransactionFormData {
  name: string;
  account: string;
  amount: string;
  date: string;
  frequency: string;
}

type Account = {
  name: string;
  amount: number | string;
  iconKey?: string
};

// ดึงบัญชีจาก localStorage (เหมือน Home.tsx)
function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem("accounts");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    { name: "ไทยพาณิชย์", amount: 20000, iconKey: "bank" },
    { name: "กสิกรไทย", amount: 20000, iconKey: "wallet" },
  ];
}

// ฟังก์ชันสำหรับแปลงวันที่เป็น DD/MM/YYYY
function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ฟังก์ชันสำหรับแปลง DD/MM/YYYY เป็น YYYY-MM-DD (สำหรับ input type="date")
function formatDateToYYYYMMDD(dateString: string): string {
  if (!dateString) return '';
  if (dateString.includes('-')) return dateString; // ถ้าเป็น YYYY-MM-DD อยู่แล้ว

  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

// ฟังก์ชันสำหรับรับวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const AddTransaction: React.FC<AddTransactionProps> = ({
  onCancel,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<TransactionFormData>(
    initialData || {
      name: '',
      account: '',
      amount: '',
      date: getTodayDate(), // ใช้วันที่ปัจจุบันเป็นค่าเริ่มต้น
      frequency: 'ทุกเดือน'
    }
  );

  // โหลดบัญชีจาก localStorage
  useEffect(() => {
    const loadedAccounts = loadAccounts();
    setAccounts(loadedAccounts);

    // ถ้ายังไม่มีบัญชีที่เลือก ให้เลือกบัญชีแรกเป็นค่าเริ่มต้น
    if (!formData.account && loadedAccounts.length > 0) {
      setFormData(prev => ({ ...prev, account: loadedAccounts[0].name }));
    }
  }, []);

  // อัพเดทข้อมูลเมื่อ initialData เปลี่ยน
  useEffect(() => {
    if (initialData) {
      console.log('initialData ได้รับ:', initialData);
      // แปลงวันที่จาก DD/MM/YYYY เป็น YYYY-MM-DD สำหรับ input
      const formattedDate = formatDateToYYYYMMDD(initialData.date);
      setFormData({
        ...initialData,
        date: formattedDate
      });
    }
  }, [initialData]);

  const handleSubmit = () => {
    console.log('handleSubmit ใน AddTransaction ถูกเรียก!');
    console.log('formData:', formData);
    console.log('Validation:', {
      name: !!formData.name,
      amount: !!formData.amount,
      date: !!formData.date
    });

    if (formData.name && formData.amount && formData.date) {
      console.log('✅ Validation ผ่าน! กำลังเรียก onSubmit...');
      // แปลงวันที่เป็น DD/MM/YYYY ก่อนส่ง
      const submissionData = {
        ...formData,
        date: formatDateToDDMMYYYY(formData.date)
      };
      onSubmit(submissionData);
    } else {
      console.log('❌ Validation ไม่ผ่าน!');
      if (!formData.name) console.log('  - ไม่มีชื่อ');
      if (!formData.amount) console.log('  - ไม่มีจำนวนเงิน');
      if (!formData.date) console.log('  - ไม่มีวันที่');
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  };

  console.log('AddTransaction render, isEditing:', isEditing);
  console.log('บัญชีที่โหลดได้:', accounts);

  return (
    <div className="add-transaction">
      <div className="form-container">
        <h1>{isEditing ? 'แก้ไขธุรกรรมที่เกิดซ้ำ' : 'เพิ่มธุรกรรมที่เกิดซ้ำ'}</h1>

        <div className="form-content">
          <div className="form-field">
            <label>ชื่อประเภท</label>
            <input
              type="text"
              placeholder="ชื่อธุรกรรม"
              value={formData.name}
              onChange={(e) => {
                console.log('ชื่อเปลี่ยนเป็น:', e.target.value);
                setFormData({ ...formData, name: e.target.value });
              }}
            />
          </div>

          <div className="form-field">
            <label>เลือกบัญชี</label>
            <select
              value={formData.account}
              onChange={(e) => {
                console.log('บัญชีเปลี่ยนเป็น:', e.target.value);
                setFormData({ ...formData, account: e.target.value });
              }}
            >
              <option value="">เลือกบัญชี</option>
              {accounts.map((acc, idx) => (
                <option key={idx} value={acc.name}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>จำนวนเงิน</label>
            <input
              type="number"
              placeholder="บาท"
              value={formData.amount}
              onChange={(e) => {
                // ล็อคให้ใส่ได้เฉพาะตัวเลข
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                  console.log('จำนวนเงินเปลี่ยนเป็น:', value);
                  setFormData({ ...formData, amount: value });
                }
              }}
              onKeyPress={(e) => {
                // ป้องกันการพิมพ์อักขระที่ไม่ใช่ตัวเลข
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div className="form-field">
            <label>วันที่</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  console.log('วันที่เปลี่ยนเป็น:', e.target.value);
                  setFormData({ ...formData, date: e.target.value });
                }}
              />
              <svg className="calendar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>

          <div className="form-field">
            <label>ความถี่</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              <option value="">เลือกความถี่</option>
              <option value="ทุกวัน">ทุกวัน</option>
              <option value="ทุกสัปดาห์">ทุกสัปดาห์</option>
              <option value="ทุกเดือน">ทุกเดือน</option>
              <option value="ทุกปี">ทุกปี</option>
            </select>
          </div>

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => {
              console.log('กดปุ่มยกเลิก');
              onCancel();
            }}>
              ยกเลิก
            </button>
            <button className="submit-btn" onClick={() => {
              console.log('กดปุ่มยืนยัน/บันทึก');
              handleSubmit();
            }}>
              {isEditing ? 'บันทึก' : 'ยืนยัน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;