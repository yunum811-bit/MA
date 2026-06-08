import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const statusLabels = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' };
const priorityLabels = { high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };

export function exportRequestsToExcel(requests, filename = 'รายการแจ้งซ่อม') {
  const data = requests.map((req, index) => ({
    'ลำดับ': index + 1,
    'หัวข้อ': req.title,
    'รายละเอียด': req.description,
    'หมวดหมู่': req.category,
    'สถานที่': req.location,
    'ความเร่งด่วน': priorityLabels[req.priority] || req.priority,
    'สถานะ': statusLabels[req.status] || req.status,
    'ผู้แจ้ง': req.requester_name || '-',
    'แผนก': req.requester_department || '-',
    'ผู้รับผิดชอบ': req.assigned_name || '-',
    'วันที่แจ้ง': req.created_at ? new Date(req.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-',
    'วันที่เสร็จ': req.completed_at ? new Date(req.completed_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },   // ลำดับ
    { wch: 25 },  // หัวข้อ
    { wch: 40 },  // รายละเอียด
    { wch: 15 },  // หมวดหมู่
    { wch: 20 },  // สถานที่
    { wch: 12 },  // ความเร่งด่วน
    { wch: 15 },  // สถานะ
    { wch: 18 },  // ผู้แจ้ง
    { wch: 15 },  // แผนก
    { wch: 18 },  // ผู้รับผิดชอบ
    { wch: 18 },  // วันที่แจ้ง
    { wch: 18 },  // วันที่เสร็จ
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการแจ้งซ่อม');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const date = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
  saveAs(blob, `${filename}_${date}.xlsx`);
}
