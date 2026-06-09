import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag, AlertTriangle, User, Clock, CheckCircle, ImagePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [repairNotes, setRepairNotes] = useState('');
  const [images, setImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician' || isAdmin;

  useEffect(() => {
    loadRequest();
    loadImages();
    if (isAdmin) {
      api.get('/dashboard/technicians').then(res => setTechnicians(res.data)).catch(() => {});
    }
  }, [id]);

  const loadRequest = () => {
    api.get(`/requests/${id}`)
      .then(res => {
        setRequest(res.data);
        setRepairNotes(res.data.notes || '');
      })
      .catch(() => navigate('/requests'))
      .finally(() => setLoading(false));
  };

  const loadImages = () => {
    api.get(`/requests/${id}/images`)
      .then(res => setImages(res.data))
      .catch(() => {});
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/requests/${id}/status`, { status: newStatus, notes: repairNotes || null });
      loadRequest();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setUpdating(true);
    try {
      await api.patch(`/requests/${id}/status`, { status: request.status, notes: repairNotes || null });
      alert('บันทึกวิธีการซ่อมสำเร็จ');
      loadRequest();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (techId) => {
    setUpdating(true);
    try {
      await api.patch(`/requests/${id}/assign`, { assigned_to: parseInt(techId) });
      loadRequest();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return;
    try {
      await api.delete(`/requests/${id}`);
      navigate('/requests');
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const statusLabels = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' };
  const statusColors = { pending: 'bg-accent-100 text-accent-800 border-accent-300', in_progress: 'bg-blue-100 text-blue-800 border-blue-300', completed: 'bg-green-100 text-green-800 border-green-300', cancelled: 'bg-red-100 text-red-800 border-red-300' };
  const priorityLabels = { high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };
  const priorityColors = { high: 'text-red-600', medium: 'text-accent-600', low: 'text-primary-600' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-600 hover:text-primary-800 mb-5 font-medium transition-colors">
        <ArrowLeft size={18} />
        <span>กลับ</span>
      </button>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-primary-100/50 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50/80 to-accent-50/50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary-900">{request.title}</h1>
              <p className="text-sm text-gray-500 mt-1 font-mono">#{request.id}</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${statusColors[request.status]}`}>
              {statusLabels[request.status]}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">รายละเอียด</h3>
              <p className="text-gray-700 leading-relaxed">{request.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl">
                <MapPin size={16} className="text-primary-500" />
                <span className="text-gray-700">{request.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl">
                <Tag size={16} className="text-primary-500" />
                <span className="text-gray-700">{request.category}</span>
              </div>
              <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl">
                <AlertTriangle size={16} className={priorityColors[request.priority]} />
                <span className="text-gray-700">ความเร่งด่วน: <strong>{priorityLabels[request.priority]}</strong></span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ข้อมูลเพิ่มเติม</h3>
            <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl">
              <User size={16} className="text-primary-500" />
              <span className="text-gray-700">ผู้แจ้ง: {request.requester_name} ({request.requester_department})</span>
            </div>
            <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl">
              <User size={16} className="text-primary-500" />
              <span className="text-gray-700">ผู้รับผิดชอบ: {request.assigned_name || <span className="text-gray-400">ยังไม่มอบหมาย</span>}</span>
            </div>
            <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl">
              <Clock size={16} className="text-primary-500" />
              <span className="text-gray-700">
                วันที่แจ้ง: {new Date(request.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {request.completed_at && (
              <div className="flex items-center gap-3 text-sm bg-green-50 p-3 rounded-xl">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-gray-700">
                  วันที่เสร็จ: {new Date(request.completed_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">รูปภาพประกอบ</h3>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => {
                const imgSrc = img.image_data.startsWith('data:') ? img.image_data : img.image_data;
                return (
                  <div
                    key={img.id}
                    className="w-28 h-28 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setViewImage(imgSrc)}
                  >
                    <img src={imgSrc} alt={img.filename} className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Repair Notes - show if exists and not editing */}
        {request.notes && !isTechnician && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-primary-800 uppercase tracking-wider mb-3">วิธีการซ่อม / บันทึกช่าง</h3>
            <div className="bg-primary-50/50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {request.notes}
            </div>
          </div>
        )}

        {/* Admin/Technician Actions */}
        {isTechnician && (
          <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-primary-50/50 to-transparent">
            <h3 className="text-xs font-semibold text-primary-800 uppercase tracking-wider mb-4">จัดการงานซ่อม</h3>

            {/* Repair details textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รายละเอียดวิธีการซ่อม</label>
              <textarea
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white resize-none text-sm"
                placeholder="บันทึกวิธีการซ่อม อะไหล่ที่ใช้ หรือหมายเหตุ..."
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Save notes button */}
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="px-5 py-2 bg-accent-400 text-primary-900 text-sm rounded-xl hover:bg-accent-500 disabled:opacity-50 shadow-sm font-semibold active:scale-[0.98] transition-all"
              >
                บันทึกวิธีซ่อม
              </button>

              {/* Status actions - only show when not completed/cancelled */}
              {request.status !== 'completed' && request.status !== 'cancelled' && (
                <>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">มอบหมาย:</label>
                      <select
                        onChange={(e) => e.target.value && handleAssign(e.target.value)}
                        disabled={updating}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        defaultValue=""
                      >
                        <option value="">เลือกช่าง</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>{t.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        disabled={updating}
                        className="px-5 py-2 bg-primary-700 text-white text-sm rounded-xl hover:bg-primary-800 disabled:opacity-50 shadow-sm font-medium active:scale-[0.98] transition-all"
                      >
                        เริ่มดำเนินการ
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange('completed')}
                        disabled={updating}
                        className="px-5 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-sm font-medium active:scale-[0.98] transition-all"
                      >
                        เสร็จสิ้น
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={updating}
                      className="px-5 py-2 bg-red-50 text-red-600 text-sm rounded-xl hover:bg-red-100 disabled:opacity-50 font-medium transition-all"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={handleDelete}
                className="mt-4 text-sm text-red-500 hover:text-red-700 hover:underline"
              >
                ลบรายการนี้
              </button>
            )}
          </div>
        )}

        {/* History */}
        {request.history && request.history.length > 0 && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">ประวัติการดำเนินการ</h3>
            <div className="space-y-4">
              {request.history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full mt-1.5 shrink-0 shadow-sm"></div>
                  <div>
                    <p className="text-sm text-gray-700">{h.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.performer_name} • {new Date(h.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {viewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setViewImage(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 z-10"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <img src={viewImage} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
