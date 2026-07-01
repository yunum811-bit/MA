import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle, XCircle, PlusCircle, Loader } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/requests')
      .then(res => setRequests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const total = requests.length;
  const pending = requests.filter(r => r.status === 'pending').length;
  const inProgress = requests.filter(r => r.status === 'in_progress').length;
  const completed = requests.filter(r => r.status === 'completed').length;
  const cancelled = requests.filter(r => r.status === 'cancelled').length;

  const recent = requests.slice(0, 5);

  const statusLabels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
  const statusColors = { pending: 'bg-accent-100 text-accent-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">สวัสดี, {user?.full_name}</h1>
          <p className="text-sm text-gray-500 mt-1">Your request summary</p>
        </div>
        <Link
          to="/requests/new"
          className="flex items-center gap-2 bg-gradient-to-r from-primary-700 to-primary-600 text-white px-5 py-2.5 rounded-xl hover:from-primary-800 hover:to-primary-700 transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98]"
        >
          <PlusCircle size={18} />
          <span>New Request</span>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{total}</p>
              <p className="text-sm text-white/80 mt-1">Total</p>
            </div>
            <ClipboardList className="h-8 w-8 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{pending}</p>
              <p className="text-sm text-white/80 mt-1">Pending</p>
            </div>
            <Clock className="h-8 w-8 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{inProgress}</p>
              <p className="text-sm text-white/80 mt-1">In Progress</p>
            </div>
            <Loader className="h-8 w-8 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{completed}</p>
              <p className="text-sm text-white/80 mt-1">Completed</p>
            </div>
            <CheckCircle className="h-8 w-8 text-white/30" />
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-primary-100/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-900">Recent Requests</h2>
          <Link to="/requests" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            View All →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-400">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((req) => (
              <Link
                key={req.id}
                to={`/requests/${req.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{req.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.location} • {new Date(req.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[req.status]}`}>
                  {statusLabels[req.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
