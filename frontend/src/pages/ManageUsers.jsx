import { useState, useEffect } from 'react';
import { Users, PlusCircle, Pencil, Trash2, X, KeyRound } from 'lucide-react';
import api from '../utils/api';

const roles = [
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: 'technician', label: 'ช่าง' },
  { value: 'user', label: 'ผู้ใช้งาน' },
];

const departments = [];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', department: '', role: 'user', phone: '', email: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deptList, setDeptList] = useState(['IT', 'ซ่อมบำรุง', 'บัญชี', 'การตลาด', 'บุคคล', 'จัดซื้อ', 'ผลิต', 'อื่นๆ']);

  useEffect(() => {
    loadUsers();
    api.get('/settings').then(res => {
      if (res.data.departments && res.data.departments.length > 0) {
        setDeptList(res.data.departments);
      }
    }).catch(() => {});
  }, []);

  const loadUsers = () => {
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const openAdd = () => {
    setEditUser(null);
    setForm({ username: '', password: '', full_name: '', department: '', role: 'user', phone: '', email: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ username: user.username, password: '', full_name: user.full_name, department: user.department, role: user.role, phone: user.phone || '', email: user.email || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
      } else {
        await api.post('/users', form);
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`ยืนยันการลบ "${user.full_name}" ?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleResetPassword = async (user) => {
    const newPassword = prompt(`รีเซ็ทรหัสผ่านของ "${user.full_name}"\n\nกรอกรหัสผ่านใหม่:`);
    if (!newPassword) return;
    if (newPassword.length < 4) {
      alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    try {
      await api.put(`/users/${user.id}`, {
        full_name: user.full_name,
        department: user.department,
        role: user.role,
        phone: user.phone,
        password: newPassword,
      });
      alert(`รีเซ็ทรหัสผ่านของ "${user.full_name}" สำเร็จ`);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const roleLabels = { admin: 'ผู้ดูแลระบบ', technician: 'ช่าง', user: 'ผู้ใช้งาน' };
  const roleColors = { admin: 'bg-red-100 text-red-700', technician: 'bg-primary-100 text-primary-700', user: 'bg-accent-100 text-accent-700' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg">
            <Users className="h-5 w-5 text-accent-300" />
          </div>
          <h1 className="text-2xl font-bold text-primary-900">จัดการพนักงาน</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-accent-400 text-primary-900 font-semibold px-4 py-2 rounded-lg hover:bg-accent-500 transition-all shadow-md"
        >
          <PlusCircle size={18} />
          <span>เพิ่มพนักงาน</span>
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-xl shadow-sm border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-50 text-left text-primary-800">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">ชื่อ-สกุล</th>
                <th className="px-4 py-3 font-medium">ชื่อผู้ใช้</th>
                <th className="px-4 py-3 font-medium">แผนก</th>
                <th className="px-4 py-3 font-medium">สิทธิ์</th>
                <th className="px-4 py-3 font-medium">โทรศัพท์</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user, i) => (
                <tr key={user.id} className="hover:bg-primary-50/50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{user.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.username}</td>
                  <td className="px-4 py-3 text-gray-600">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(user)} className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg" title="แก้ไข">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleResetPassword(user)} className="p-1.5 text-accent-600 hover:bg-accent-100 rounded-lg" title="รีเซ็ทรหัสผ่าน">
                        <KeyRound size={15} />
                      </button>
                      <button onClick={() => handleDelete(user)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg" title="ลบ">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-primary-900">
                {editUser ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-สกุล *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้ *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editUser ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required={!editUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">แผนก *</label>
                  <select
                    value={form.department}
                    onChange={e => setForm({...form, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">เลือกแผนก</option>
                    {deptList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สิทธิ์ *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โทรศัพท์</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="081-xxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="name@company.com"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-primary-700 to-primary-600 text-white py-2 rounded-lg hover:from-primary-800 hover:to-primary-700 disabled:opacity-50 font-medium"
                >
                  {saving ? 'กำลังบันทึก...' : editUser ? 'บันทึก' : 'เพิ่มพนักงาน'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
