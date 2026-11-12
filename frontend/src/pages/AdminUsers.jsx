import { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { fullName, errorText } from '../utils';

const EMPTY = { username: '', first_name: '', last_name: '', email: '', password: '' };

export default function AdminUsers({ role }) {
  const label = role === 'student' ? 'Student' : 'Teacher';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    return api.get(`/users/?role=${role}`)
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [role]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function create(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const body = { ...form, role };
    if (!body.password) delete body.password;
    try {
      await api.post('/users/', body);
      setMessage(
        `${label} "${form.username}" created.` +
        (body.password ? '' : ' Default password: changeme123')
      );
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function remove(u) {
    if (!window.confirm(`Delete ${fullName(u)}? Their attendance records will be deleted too.`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/users/${u.id}/`);
      setMessage(`${fullName(u)} deleted.`);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function resetPassword(u) {
    const pw = window.prompt(`New password for ${u.username}:`);
    if (!pw) return;
    setError('');
    setMessage('');
    try {
      await api.patch(`/users/${u.id}/`, { password: pw });
      setMessage(`Password updated for ${u.username}.`);
    } catch (err) {
      setError(errorText(err));
    }
  }

  const q = search.trim().toLowerCase();
  const shown = users.filter(
    (u) => !q || fullName(u).toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
  );

  return (
    <Layout title={`${label}s`}>
      <h3>Add a {label.toLowerCase()}</h3>
      <form onSubmit={create}>
        <div className="form-grid">
          <input placeholder="Username *" required value={form.username} onChange={setField('username')} />
          <input placeholder="First name" value={form.first_name} onChange={setField('first_name')} />
          <input placeholder="Last name" value={form.last_name} onChange={setField('last_name')} />
          <input type="email" placeholder="Email (optional)" value={form.email} onChange={setField('email')} />
          <input type="password" placeholder="Password (blank = changeme123)" value={form.password} onChange={setField('password')} />
        </div>
        <button type="submit">Add {label.toLowerCase()}</button>
      </form>
      {message && <p className="msg">{message}</p>}
      {error && <p className="error">{error}</p>}

      <h3>All {label.toLowerCase()}s ({users.length})</h3>
      <div className="toolbar">
        <input placeholder="Search by name or username" value={search}
               onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <p>Loading...</p> : shown.length === 0 ? (
        <p className="empty">No {label.toLowerCase()}s found.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>Username</th><th>Email</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id}>
                <td>{fullName(u)}</td>
                <td>{u.username}</td>
                <td>{u.email || '-'}</td>
                <td>
                  <div className="actions">
                    <button className="btn-ghost" onClick={() => resetPassword(u)}>Reset password</button>
                    <button className="btn-danger" onClick={() => remove(u)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}