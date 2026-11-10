import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import Layout from '../components/Layout';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/')
      .then((res) => setCourses(res.data.filter((c) => c.teacher === user.id)))
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <Layout title="My Courses">
      {loading ? <p>Loading...</p> : courses.length === 0 ? (
        <p>No courses assigned to you yet.</p>
      ) : (
        <table>
          <thead><tr><th>Code</th><th>Course</th><th></th></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td><Link to={`/teacher/course/${c.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}