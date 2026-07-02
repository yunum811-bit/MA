import { useState, useEffect } from 'react';
import { ClipboardList, Clock, Loader, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  const loadStats = (month) => {
    setLoading(true);
    const url = month ? `/dashboard/stats?month=${month}` : '/dashboard/stats';
    api.get(url)
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats(selectedMonth);
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) return <div className="text-red-500">ไม่สามารถโหลดข้อมูลได้</div>;

  const statCards = [
    { label: 'ทั้งหมด', value: stats.total, icon: ClipboardList, gradient: 'from-primary-500 to-primary-700', iconBg: 'bg-white/20' },
    { label: 'รอดำเนินการ', value: stats.pending, icon: Clock, gradient: 'from-accent-400 to-accent-600', iconBg: 'bg-white/20' },
    { label: 'กำลังดำเนินการ', value: stats.inProgress, icon: Loader, gradient: 'from-blue-500 to-blue-700', iconBg: 'bg-white/20' },
    { label: 'เสร็จสิ้น', value: stats.completed, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-700', iconBg: 'bg-white/20' },
    { label: 'ยกเลิก', value: stats.cancelled, icon: XCircle, gradient: 'from-rose-500 to-rose-700', iconBg: 'bg-white/20' },
  ];

  // Pie chart data - status
  const statusPieData = [
    { name: 'รอดำเนินการ', value: stats.pending, color: '#facc15' },
    { name: 'กำลังดำเนินการ', value: stats.inProgress, color: '#3b82f6' },
    { name: 'เสร็จสิ้น', value: stats.completed, color: '#22c55e' },
    { name: 'ยกเลิก', value: stats.cancelled, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Bar chart data - category
  const categoryBarData = stats.byCategory.map(item => ({
    name: item.category,
    จำนวน: item.count,
  }));

  // Priority pie data
  const priorityLabels = { high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };
  const priorityColors = { high: '#ef4444', medium: '#facc15', low: '#22c55e' };
  const priorityPieData = stats.byPriority.map(item => ({
    name: priorityLabels[item.priority],
    value: item.count,
    color: priorityColors[item.priority],
  }));

  const statusLabels = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' };
  const statusColors = { pending: 'bg-accent-100 text-accent-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
  const priorityBadgeColors = { high: 'bg-red-100 text-red-700', medium: 'bg-accent-100 text-accent-700', low: 'bg-primary-100 text-primary-700' };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 text-sm">
          <p className="font-medium text-gray-800">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-primary-600 font-bold">{payload[0].value} รายการ</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg shadow-primary-600/20">
            <TrendingUp className="h-5 w-5 text-accent-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">{t('dashboardTitle')}</h1>
            <p className="text-sm text-gray-500">{t('dashboardSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          />
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth('')}
              className="text-sm text-red-500 hover:text-red-700 font-medium px-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 shadow-lg card-hover`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p className="text-sm text-white/80 mt-1">{card.label}</p>
              </div>
              <div className={`p-3 ${card.iconBg} rounded-xl`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Bar Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-primary-100/50">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('statusRatio')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusPieData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} width={75} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                {statusPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-primary-100/50">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">จำนวนงานตามหมวดหมู่</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryBarData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="จำนวน" radius={[8, 8, 0, 0]}>
                {categoryBarData.map((entry, index) => (
                  <Cell key={index} fill={index % 2 === 0 ? '#16a34a' : '#facc15'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Priority Pie */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-primary-100/50">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">ตามความเร่งด่วน</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={priorityPieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={false}
              >
                {priorityPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Area Chart - simulated trend */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-primary-100/50">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('overview')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={[
                { name: 'รอดำเนินการ', value: stats.pending },
                { name: 'กำลังดำเนินการ', value: stats.inProgress },
                { name: 'เสร็จสิ้น', value: stats.completed },
                { name: 'ยกเลิก', value: stats.cancelled },
              ]}
              margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#16a34a"
                strokeWidth={3}
                fill="url(#colorGradient)"
                dot={{ fill: '#16a34a', strokeWidth: 2, r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {stats.monthly && stats.monthly.length > 1 && (
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-primary-100/50">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">{t('overview')}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.monthly} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#facc15" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="total" name={t('total')} stroke="#16a34a" strokeWidth={2} fill="url(#colorTotal)" dot={{ fill: '#16a34a', r: 4 }} />
              <Area type="monotone" dataKey="completed" name={t('completed')} stroke="#facc15" strokeWidth={2} fill="url(#colorCompleted)" dot={{ fill: '#facc15', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Requests */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-primary-100/50">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">รายการล่าสุด</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-primary-100">
                <th className="pb-3 font-medium">หัวข้อ</th>
                <th className="pb-3 font-medium">ผู้แจ้ง</th>
                <th className="pb-3 font-medium">หมวดหมู่</th>
                <th className="pb-3 font-medium">สถานะ</th>
                <th className="pb-3 font-medium">ความเร่งด่วน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recent.map((req) => (
                <tr key={req.id} className="hover:bg-primary-50/50 transition-colors">
                  <td className="py-3.5 font-medium text-gray-800">{req.title}</td>
                  <td className="py-3.5 text-gray-600">{req.requester_name}</td>
                  <td className="py-3.5 text-gray-600">{req.category}</td>
                  <td className="py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[req.status]}`}>
                      {statusLabels[req.status]}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityBadgeColors[req.priority]}`}>
                      {priorityLabels[req.priority]}
                    </span>
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
