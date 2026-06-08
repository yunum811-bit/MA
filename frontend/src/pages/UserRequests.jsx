import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PlusCircle, FileDown } from 'lucide-react';
import api from '../utils/api';
import { exportRequestsToExcel } from '../utils/exportExcel';

export default function UserRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/requests')
      .then(res => setRequests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const statusLabels = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' };
  const statusColors = { pending: 'bg-accent-100 text-accent-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-accent-100 text-accent-700', low: 'bg-primary-100 text-primary-700' };
  const priorityLabels = { high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };

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
            <h1 className="text-2xl font-bold text-primary-900">รายการแจ้งซ่อมของฉัน</h1>
            <p className="text-sm text-gray-500">{requests.length} รายการ</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportRequestsToExcel(requests, 'รายการแจ้งซ่อมของฉัน')}
            className="flex items-center gap-2 bg-accent-400 text-primary-900 font-semibold px-4 py-2.5 rounded-xl hover:bg-accent-500 transition-all shadow-md active:scale-[0.98]"
          >
            <FileDown size={18} />
            <span>Export</span>
          </button>
          <Link
            to="/requests/new"
            className="flex items-center gap-2 bg-gradient-to-r from-primary-700 to-primary-600 text-white px-5 py-2.5 rounded-xl hover:from-primary-800 hover:to-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98]"
          >
            <PlusCircle size={18} />
            <span>แจ้งซ่อมใหม่</span>
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-16 text-center shadow-sm border border-primary-100/50">
          <ClipboardList className="mx-auto h-16 w-16 text-primary-200 mb-4" />
          <p className="text-gray-500 text-lg">ยังไม่มีรายการแจ้งซ่อม</p>
          <Link to="/requests/new" className="inline-block mt-4 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-medium">
            สร้างรายการแจ้งซ่อมใหม่
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link
              key={req.id}
              to={`/requests/${req.id}`}
              className="block bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-primary-100/50 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{req.title}</h3>
                  <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-2">
                    <span>{req.location}</span>
                    <span className="text-gray-300">•</span>
                    <span>{req.category}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(req.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColors[req.status]}`}>
                    {statusLabels[req.status]}
                  </span>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${priorityColors[req.priority]}`}>
                    {priorityLabels[req.priority]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
