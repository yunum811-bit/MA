import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Filter, FileDown, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { exportRequestsToExcel } from '../utils/exportExcel';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [requesterFilter, setRequesterFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    api.get('/requests')
      .then(res => setRequests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ ยืนยันการลบรายการแจ้งซ่อมทั้งหมด?\n\nข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้')) return;
    if (!confirm('คุณแน่ใจหรือไม่? กด OK เพื่อลบทั้งหมด')) return;
    try {
      await api.delete('/requests/clear-all');
      alert('ลบรายการทั้งหมดสำเร็จ');
      setRequests([]);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const statusLabels = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' };
  const statusColors = { pending: 'bg-accent-100 text-accent-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-accent-100 text-accent-700', low: 'bg-primary-100 text-primary-700' };
  const priorityLabels = { high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };

  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
    if (requesterFilter !== 'all' && r.requester_name !== requesterFilter) return false;
    if (dateFrom && r.created_at < dateFrom) return false;
    if (dateTo && r.created_at > dateTo + 'T23:59:59') return false;
    return true;
  });

  // Get unique requester names for filter
  const requesterNames = [...new Set(requests.map(r => r.requester_name).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg shadow-primary-600/20">
            <ClipboardList className="h-5 w-5 text-accent-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">จัดการงานซ่อม</h1>
            <p className="text-sm text-gray-500">{filtered.length} รายการ</p>
          </div>
        </div>
        <button
          onClick={() => exportRequestsToExcel(filtered)}
          className="flex items-center gap-2 bg-accent-400 text-primary-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-accent-500 transition-all shadow-md active:scale-[0.98]"
        >
          <FileDown size={18} />
          <span>Export Excel</span>
        </button>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 bg-red-100 text-red-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-200 transition-all active:scale-[0.98]"
        >
          <Trash2 size={18} />
          <span>ลบทั้งหมด</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-primary-100/50 mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-primary-500" />
            <span className="text-sm text-gray-500 font-medium">กรอง:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="in_progress">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="all">ทุกความเร่งด่วน</option>
            <option value="high">สูง</option>
            <option value="medium">ปานกลาง</option>
            <option value="low">ต่ำ</option>
          </select>
          <select
            value={requesterFilter}
            onChange={(e) => setRequesterFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          >
            <option value="all">ทุกพนักงาน</option>
            {requesterNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">จาก:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">ถึง:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            />
          </div>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || requesterFilter !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setRequesterFilter('all'); setDateFrom(''); setDateTo(''); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-400">{filtered.length} รายการ</div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-primary-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-primary-50 to-primary-100/50 text-left text-primary-800">
                <th className="px-4 py-3.5 font-semibold">#</th>
                <th className="px-4 py-3.5 font-semibold">หัวข้อ</th>
                <th className="px-4 py-3.5 font-semibold">ผู้แจ้ง</th>
                <th className="px-4 py-3.5 font-semibold">แผนก</th>
                <th className="px-4 py-3.5 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3.5 font-semibold">สถานะ</th>
                <th className="px-4 py-3.5 font-semibold">ความเร่งด่วน</th>
                <th className="px-4 py-3.5 font-semibold">ผู้รับผิดชอบ</th>
                <th className="px-4 py-3.5 font-semibold">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-primary-50/50 transition-colors">
                  <td className="px-4 py-3.5 text-gray-400 font-mono">{req.id}</td>
                  <td className="px-4 py-3.5">
                    <Link to={`/requests/${req.id}`} className="text-primary-700 hover:text-primary-900 hover:underline font-medium">
                      {req.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{req.requester_name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{req.requester_department}</td>
                  <td className="px-4 py-3.5 text-gray-600">{req.category}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[req.status]}`}>
                      {statusLabels[req.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[req.priority]}`}>
                      {priorityLabels[req.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{req.assigned_name || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">
                    {new Date(req.created_at).toLocaleDateString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
