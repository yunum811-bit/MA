import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ImagePlus, X } from 'lucide-react';
import api from '../utils/api';

export default function NewRequest() {
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '', priority: 'medium' });
  const [categories, setCategories] = useState(['ไฟฟ้า/แอร์', 'ประปา', 'IT/คอมพิวเตอร์', 'อาคาร/สถานที่', 'อื่นๆ']);
  const [images, setImages] = useState([]);
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('แนบรูปได้สูงสุด 5 รูป');
      return;
    }
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} ขนาดเกิน 5MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, { data: reader.result, filename: file.name, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/requests', form);
      // Upload images if any
      if (images.length > 0) {
        await api.post(`/requests/${res.data.id}/images`, {
          images: images.map(img => ({ data: img.data, filename: img.filename }))
        });
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
          <h1 className="text-2xl font-bold text-primary-900">แจ้งซ่อมใหม่</h1>
          <p className="text-sm text-gray-500">กรอกข้อมูลรายละเอียดปัญหาที่ต้องการแจ้งซ่อม</p>
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

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">แนบรูปภาพ (สูงสุด 5 รูป)</label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-primary-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
                  <ImagePlus size={24} className="text-primary-400" />
                  <span className="text-xs text-primary-500 mt-1">เพิ่มรูป</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary-700 to-primary-600 text-white py-3 rounded-xl hover:from-primary-800 hover:to-primary-700 transition-all disabled:opacity-50 font-semibold shadow-lg shadow-primary-600/20 active:scale-[0.98]"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งแจ้งซ่อม'}
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
