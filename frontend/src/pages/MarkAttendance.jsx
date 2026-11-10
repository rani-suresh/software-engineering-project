import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';

const OPTIONS = ['present', 'late', 'absent'];

export default function MarkAttendance() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [roster, setRoster] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/sessions/${sessionId}/mark/`).then((res) => {
      setRoster(res.data.map((r) => ({ ...r, status: r.status || 'present' })));
    });
  }, [sessionId]);

  function setStatus(studentId, status) {
    setRoster((prev) => prev.map((r) => (r.student === studentId ? { ...r, status } : r)));
  }

  function markAll(status) {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  }

  async function save() {
    setMessage('');
    const records = roster.map((r) => ({ student: r.student, status: r.status }));
    try {
      const res = await api.post(`/sessions/${sessionId}/mark/`, { records });
      setMessage(`Saved ${res.data.saved} records.`);
    } catch {
      setMessage('Could not save. Please try again.');
    }
  }

  return (
    <Layout title="Mark Attendance">
      <p><button onClick={() => navigate(-1)}>← Back</button></p>
      <p>
        Set all: <button onClick={() => markAll('present')}>Present</button>{' '}
        <button onClick={() => markAll('absent')}>Absent</button>
      </p>

      {roster.length === 0 ? <p>No students enrolled in this course.</p> : (
        <table>
          <thead><tr><th>Student</th>{OPTIONS.map((o) => <th key={o}>{o}</th>)}</tr></thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.student}>
                <td>{r.name}</td>
                {OPTIONS.map((o) => (
                  <td key={o}>
                    <input type="radio" name={`s${r.student}`} checked={r.status === o}
                           onChange={() => setStatus(r.student, o)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p><button onClick={save}>Save attendance</button></p>
      {message && <p>{message}</p>}
    </Layout>
  );
}