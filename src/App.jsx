import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import TrainerDashboard from './pages/TrainerDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import SplashScreen from './components/SplashScreen.jsx';

function Gate() {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;
  if (!user) return <Login />;
  if (user.must_change_password) return <ChangePassword />;
  return user.role === 'trainer' ? <TrainerDashboard /> : <UserDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="*" element={<Gate />} />
      </Routes>
    </AuthProvider>
  );
}
