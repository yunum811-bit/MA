import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminRequests from './pages/AdminRequests';
import UserRequests from './pages/UserRequests';
import NewRequest from './pages/NewRequest';
import RequestDetail from './pages/RequestDetail';
import ManageUsers from './pages/ManageUsers';
import Settings from './pages/Settings';
import UserDashboard from './pages/UserDashboard';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          user?.role === 'admin' || user?.role === 'technician'
            ? <Dashboard />
            : <UserDashboard />
        } />
        <Route path="dashboard" element={
          user?.role === 'admin' || user?.role === 'technician'
            ? <ProtectedRoute roles={['admin', 'technician']}><Dashboard /></ProtectedRoute>
            : <UserDashboard />
        } />
        <Route path="requests" element={
          user?.role === 'admin' || user?.role === 'technician'
            ? <AdminRequests />
            : <UserRequests />
        } />
        <Route path="requests/new" element={<NewRequest />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="users" element={
          <ProtectedRoute roles={['admin']}>
            <ManageUsers />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute roles={['admin']}>
            <Settings />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
