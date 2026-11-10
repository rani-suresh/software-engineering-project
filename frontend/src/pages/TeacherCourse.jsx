import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';

export default function TeacherCourse() {
  const { courseId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.get(`/sessions/?course=${courseId}`).then((res) => setSessions(res.data));
    api.get(`/reports/course/${courseId}/`).then((res) => setReport(res.data));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [courseId]);

  async function createSession(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/sessions/', { course: courseId, date, topic });
      setTopic('');
      load();
    } catch {
      setError('Could not create the session. One may already exist for that date.');
    }
  }

  return (
    <Layout title={report ? report.course : 'Course'}>
      <p><Link to="/teacher">← Back to courses</Link></p>

      <h3>New class session</h3>
      <form onSubmit={createSession}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />{' '}
        <input placeholder="Topic (optional)" value={topic}
               onChange={(e) => setTopic(e.target.value)} />{' '}
        <button type="submit">Create</button>
        {error && <p className="error">{error}</p>}
      </form>

      <h3>Sessions</h3>
      {sessions.length === 0 ? <p>No sessions yet.</p> : (
        <table>
          <thead><tr><th>Date</th><th>Topic</th><th></th></tr></thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.date}</td>
                <td>{s.topic}</td>
                <td><Link to={`/teacher/session/${s.id}`}>Mark attendance</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Attendance report</h3>
      {!report ? <p>Loading...</p> : (
        <table>
          <thead><tr><th>Student</th><th>Classes</th><th>Attended</th><th>Percentage</th></tr></thead>
          <tbody>
            {report.students.map((s) => (
              <tr key={s.student_id}>
                <td>{s.name}</td>
                <td>{s.total_sessions}</td>
                <td>{s.attended}</td>
                <td className={s.percentage !== null && s.percentage < 75 ? 'warn' : ''}>
                  {s.percentage === null ? '-' : `${s.percentage}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}