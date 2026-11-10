import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

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
    <div className="container" style={{ maxWidth: 360 }}>
      <h2>Attendance System</h2>
      <form onSubmit={handleSubmit}>
        <p>
          <input placeholder="Username" value={username}
                 onChange={(e) => setUsername(e.target.value)} />
        </p>
        <p>
          <input type="password" placeholder="Password" value={password}
                 onChange={(e) => setPassword(e.target.value)} />
        </p>
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}