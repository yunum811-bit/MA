import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Wrench, LayoutDashboard, ClipboardList, PlusCircle, LogOut, User, Users, Settings, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data.logo) setLogo(res.data.logo);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-accent-400/90 text-primary-900 font-semibold shadow-sm'
        : 'text-primary-100/90 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-primary-950 via-primary-900 to-primary-800 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-400/5 rounded-full"></div>
        <div className="absolute bottom-20 -left-10 w-32 h-32 bg-accent-400/5 rounded-full"></div>

        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl overflow-hidden flex items-center justify-center" style={{minWidth: '44px', minHeight: '44px'}}>
              {logo ? (
                <img src={logo} alt="Logo" className="w-11 h-11 object-contain" />
              ) : (
                <Wrench className="h-7 w-7 text-accent-400" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">Service Request</h1>
              <p className="text-xs text-primary-300/80">Maintenance System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          <p className="text-xs text-primary-400 uppercase tracking-wider px-4 mb-2 mt-2">{t('menu')}</p>
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={20} />
            <span>{t('dashboard')}</span>
          </NavLink>
          <NavLink to="/requests" className={navLinkClass}>
            <ClipboardList size={20} />
            <span>{t('allRequests')}</span>
          </NavLink>
          <NavLink to="/requests/new" className={navLinkClass}>
            <PlusCircle size={20} />
            <span>{t('newRequest')}</span>
          </NavLink>

          {user?.role === 'admin' && (
            <>
              <p className="text-xs text-primary-400 uppercase tracking-wider px-4 mb-2 mt-5">{t('management')}</p>
              <NavLink to="/users" className={navLinkClass}>
                <Users size={20} />
                <span>{t('manageUsers')}</span>
              </NavLink>
              <NavLink to="/settings" className={navLinkClass}>
                <Settings size={20} />
                <span>{t('settings')}</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-300 to-accent-500 rounded-full flex items-center justify-center shadow-md">
              <User size={18} className="text-primary-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-primary-300/80">
                {user?.role === 'admin' ? t('admin') : user?.role === 'technician' ? t('technician') : t('user')}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mb-2 px-2">
            <button
              onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
              className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs text-primary-200/80 hover:bg-white/10 rounded-lg transition-all"
            >
              <Globe size={14} />
              <span>{lang === 'th' ? 'EN / ไทย' : 'TH / English'}</span>
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-primary-200/80 hover:bg-white/10 hover:text-white rounded-xl transition-all"
          >
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
