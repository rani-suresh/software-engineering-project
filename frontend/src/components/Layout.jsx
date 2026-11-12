import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Icon from './Icons';

const NAV = {
  student: [{ to: '/student', label: 'Dashboard', icon: 'grid' }],
  teacher: [{ to: '/teacher', label: 'My Courses', icon: 'book' }],
  admin: [{ to: '/admin', label: 'Dashboard', icon: 'grid' }],
};

export default function Layout({ title, plain = false, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const initial = (user?.name || '?').charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page">
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="logo"><Icon name="check" size={18} /></span>
            AttendEase
          </div>
          <div className="profile">
            <div className="avatar">{initial}</div>
            <div>
              <div className="pname">{user?.name}</div>
              <div className="prole">{user?.role}</div>
            </div>
          </div>
          <nav className="nav">
            {(NAV[user?.role] || []).map((item) => (
              <NavLink key={item.to} to={item.to}>
                <Icon name={item.icon} /> {item.label}
              </NavLink>
            ))}
          </nav>
          <button className="logout" onClick={handleLogout}>
            <Icon name="logout" /> Log out
          </button>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <h1>{title}</h1>
              <div className="date">{today}</div>
            </div>
            <span className="chip">{user?.role}</span>
          </div>
          {plain ? children : <div className="card">{children}</div>}
        </main>
      </div>
    </div>
  );
}