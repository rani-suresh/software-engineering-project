import { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';

export default function StudentDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/my-attendance/')
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="My Attendance">
      {loading ? <p>Loading...</p> : rows.length === 0 ? (
        <p>You are not enrolled in any courses yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Course</th><th>Classes</th><th>Attended</th><th>Absent</th><th>Percentage</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.course_id}>
                <td>{r.course}</td>
                <td>{r.total_sessions}</td>
                <td>{r.attended}</td>
                <td>{r.absent}</td>
                <td className={r.percentage !== null && r.percentage < 75 ? 'warn' : ''}>
                  {r.percentage === null ? '-' : `${r.percentage}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}