import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const u = await login(username, password);
      navigate(`/${u.role}`);
    } catch {
      setError('Invalid username or password');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="auth-brand">
            <span className="logo"><Icon name="check" size={18} /></span>
            AttendEase
          </div>
          <div>
            <h1>Attendance, made simple.</h1>
            <p>Mark, track and understand attendance across every class, all in one place.</p>
            <ul>
              <li><Icon name="check" /> Quick marking for teachers</li>
              <li><Icon name="calendar" /> Live percentages for students</li>
              <li><Icon name="alert" /> Early warnings for low attendance</li>
            </ul>
          </div>
        </div>

        <div className="auth-form">
          <h2>Welcome back</h2>
          <p className="sub">Sign in to continue to your dashboard.</p>
          <form onSubmit={handleSubmit}>
            <label>Username</label>
            <input placeholder="Enter your username" value={username}
                   onChange={(e) => setUsername(e.target.value)} />
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password}
                   onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Sign in</button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}