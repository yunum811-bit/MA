import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ImagePlus, X } from 'lucide-react';
import api from '../utils/api';

export default function NewRequest() {
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '', priority: 'medium' });
  const [categories, setCategories] = useState(['ไฟฟ้า/แอร์', 'ประปา', 'IT/คอมพิวเตอร์', 'อาคาร/สถานที่', 'อื่นๆ']);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data.categories && res.data.categories.length > 0) {
        setCategories(res.data.categories);
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} ขนาดเกิน 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews(prev => {
          if (prev.length >= 5) return prev;
          return [...prev, { data: reader.result, filename: file.name }];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePreview = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Create request
      const res = await api.post('/requests', form);
      const requestId = res.data.id;

      // 2. Upload each image immediately
      for (const img of previews) {
        try {
          await api.post(`/requests/${requestId}/images`, {
            images: [{ data: img.data, filename: img.filename }]
          });
        } catch (imgErr) {
          console.error('Upload failed:', imgErr);
        }
      }

      navigate('/requests');
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg shadow-primary-600/20">
          <PlusCircle className="h-5 w-5 text-accent-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-900">New Request</h1>
          <p className="text-sm text-gray-500">Fill in the details of the issue you want to report</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-7 shadow-sm border border-primary-100/50">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">หัวข้อ *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50/50 transition-all"
              placeholder="เช่น แอร์ไม่เย็น, ก๊อกน้ำรั่ว"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">รายละเอียด *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50/50 resize-none transition-all"
              placeholder="อธิบายปัญหาที่พบโดยละเอียด"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">หมวดหมู่ *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50/50"
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ความเร่งด่วน</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50/50"
              >
                <option value="low">ต่ำ</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">สูง</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานที่ *</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50/50 transition-all"
              placeholder="เช่น ห้องประชุม ชั้น 3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่แจ้งซ่อม *</label>
            <input
              type="date"
              name="request_date"
              value={form.request_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50/50 transition-all"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">แนบรูปภาพ (สูงสุด 5 รูป)</label>
            
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {previews.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={img.data} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previews.length < 5 && (
              <label className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 font-medium px-4 py-2 rounded-xl hover:bg-primary-100 cursor-pointer transition-all text-sm">
                <ImagePlus size={16} />
                <span>เลือกรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}

            {previews.length > 0 && (
              <p className="text-xs text-primary-600 mt-2 font-medium">แนบแล้ว {previews.length} รูป</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary-700 to-primary-600 text-white py-3 rounded-xl hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 font-semibold shadow-lg shadow-primary-600/20 active:scale-[0.98]"
            >
              {loading ? 'กำลังส่ง...' : `ส่งแจ้งซ่อม${previews.length > 0 ? ` (${previews.length} รูป)` : ''}`}
            </button>
            <button
              type="button"
              onClick={() => navigate('/requests')}
              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 font-medium"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
