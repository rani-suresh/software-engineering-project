import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{title}</h2>
        <div>
          {user?.name} ({user?.role}){' '}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <hr />
      {children}
    </div>
  );
}