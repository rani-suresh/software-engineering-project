import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { errorText } from '../utils';

const RISK_CLASS = { low: 'good', medium: 'mid', high: 'bad' };

export default function TeacherCourse() {
  const { courseId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [report, setReport] = useState(null);
  const [risk, setRisk] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.get(`/sessions/?course=${courseId}`).then((res) => setSessions(res.data));
    api.get(`/reports/course/${courseId}/`).then((res) => setReport(res.data));
    api.get(`/ai/at-risk/${courseId}/`).then((res) => setRisk(res.data.students));
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

  async function generateSummary() {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await api.get(`/ai/summary/${courseId}/`);
      setSummary(res.data);
    } catch (err) {
      setSummaryError(errorText(err));
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <Layout title={report ? report.course : 'Course'}>
      <p><Link to="/teacher">← Back to courses</Link></p>

      <h3>AI insights</h3>
      <div className="ai-box">
        <div className="ai-head">
          <strong>Course summary</strong>
          {summary && (
            <span className={`badge ${summary.source === 'ai' ? 'good' : 'none'}`}>
              {summary.source === 'ai' ? 'AI generated' : 'Automatic'}
            </span>
          )}
        </div>
        <p>
          {summary
            ? summary.summary
            : 'Generate a short plain-language report on how attendance is going in this course.'}
        </p>
        {summary?.note && <small>{summary.note}</small>}
        {summaryError && <p className="error">{summaryError}</p>}
        <button onClick={generateSummary} disabled={summaryLoading}>
          {summaryLoading ? 'Generating...' : summary ? 'Regenerate' : 'Generate summary'}
        </button>
      </div>

      <h3>Students at risk</h3>
      {risk.length === 0 ? (
        <p className="empty">Risk scores appear once classes have been recorded.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Student</th><th>Overall</th><th>Last 5 classes</th>
              <th>Absent in a row</th><th>Projected</th><th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {risk.map((r) => (
              <tr key={r.student_id}>
                <td>{r.name}</td>
                <td>{r.overall}%</td>
                <td>{r.recent_rate}%</td>
                <td>{r.absence_streak}</td>
                <td>{r.projected_percentage}%</td>
                <td><span className={`badge ${RISK_CLASS[r.risk_level]}`}>{r.risk_level}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>New class session</h3>
      <form onSubmit={createSession}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />{' '}
        <input placeholder="Topic (optional)" value={topic}
               onChange={(e) => setTopic(e.target.value)} />{' '}
        <button type="submit">Create</button>
        {error && <p className="error">{error}</p>}
      </form>

      <h3>Sessions</h3>
      {sessions.length === 0 ? <p className="empty">No sessions yet.</p> : (
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