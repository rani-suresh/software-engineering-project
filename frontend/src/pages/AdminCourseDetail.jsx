import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { fullName, errorText } from '../utils';

export default function AdminCourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    return Promise.all([
      api.get(`/courses/${courseId}/`),
      api.get(`/enrollments/?course=${courseId}`),
      api.get('/users/?role=student'),
    ]).then(([c, e, s]) => {
      setCourse(c.data);
      setEnrolled(e.data);
      setStudents(s.data);
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load().catch(() => setError('Could not load this course.')); }, [courseId]);

  const byId = Object.fromEntries(students.map((s) => [s.id, s]));
  const enrolledIds = new Set(enrolled.map((e) => e.student));
  const q = search.trim().toLowerCase();
  const available = students.filter(
    (s) =>
      !enrolledIds.has(s.id) &&
      (!q || fullName(s).toLowerCase().includes(q) || s.username.toLowerCase().includes(q))
  );

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function enroll() {
    setError('');
    setMessage('');
    const results = await Promise.allSettled(
      selected.map((id) => api.post('/enrollments/', { student: id, course: Number(courseId) }))
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    setMessage(`${ok} student${ok === 1 ? '' : 's'} enrolled.`);
    if (ok < selected.length) setError('Some students could not be enrolled.');
    setSelected([]);
    load();
  }

  async function unenroll(enrollment, name) {
    if (!window.confirm(`Remove ${name} from this course?`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/enrollments/${enrollment.id}/`);
      setMessage(`${name} removed from the course.`);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <Layout title={course ? `${course.code} · ${course.name}` : 'Course'}>
      <p><Link to="/admin/courses">← Back to courses</Link></p>
      {course && (
        <p className="empty">Teacher: {course.teacher_name || 'Not assigned yet'}</p>
      )}
      {message && <p className="msg">{message}</p>}
      {error && <p className="error">{error}</p>}

      <h3>Enrolled students ({enrolled.length})</h3>
      {enrolled.length === 0 ? (
        <p className="empty">No students enrolled yet.</p>
      ) : (
        <table>
          <thead><tr><th>Name</th><th>Username</th><th></th></tr></thead>
          <tbody>
            {enrolled.map((e) => {
              const s = byId[e.student];
              const name = s ? fullName(s) : e.student_name;
              return (
                <tr key={e.id}>
                  <td>{name}</td>
                  <td>{s ? s.username : e.student_name}</td>
                  <td>
                    <button className="btn-danger" onClick={() => unenroll(e, name)}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3>Add students</h3>
      <div className="toolbar">
        <input placeholder="Search students" value={search}
               onChange={(e) => setSearch(e.target.value)} />
        <div className="actions">
          <button className="btn-ghost" onClick={() => setSelected(available.map((s) => s.id))}>
            Select all shown
          </button>
          <button className="btn-ghost" onClick={() => setSelected([])}>Clear</button>
        </div>
      </div>

      {available.length === 0 ? (
        <p className="empty">No more students available to add.</p>
      ) : (
        <div className="checklist">
          {available.map((s) => (
            <label className="check" key={s.id}>
              <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
              <span>{fullName(s)} <small>{s.username}</small></span>
            </label>
          ))}
        </div>
      )}
      <button onClick={enroll} disabled={selected.length === 0}>
        Enroll {selected.length || ''} selected
      </button>
    </Layout>
  );
}