import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { fullName, errorText } from '../utils';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', name: '', teacher: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    return Promise.all([
      api.get('/courses/'),
      api.get('/users/?role=teacher'),
      api.get('/enrollments/'),
    ])
      .then(([c, t, e]) => {
        setCourses(c.data);
        setTeachers(t.data);
        setEnrollments(e.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const countFor = (courseId) => enrollments.filter((e) => e.course === courseId).length;

  async function create(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/courses/', {
        code: form.code,
        name: form.name,
        teacher: form.teacher ? Number(form.teacher) : null,
      });
      setMessage(`Course ${form.code} created.`);
      setForm({ code: '', name: '', teacher: '' });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function changeTeacher(course, value) {
    setError('');
    setMessage('');
    try {
      await api.patch(`/courses/${course.id}/`, { teacher: value ? Number(value) : null });
      setMessage(`Teacher updated for ${course.code}.`);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function remove(course) {
    if (!window.confirm(`Delete ${course.code}? Its sessions and attendance records will be deleted too.`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/courses/${course.id}/`);
      setMessage(`${course.code} deleted.`);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <Layout title="Courses">
      <h3>Add a course</h3>
      <form onSubmit={create}>
        <div className="form-grid">
          <input placeholder="Code (e.g. CS101) *" required value={form.code}
                 onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input placeholder="Course name *" required value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}>
            <option value="">No teacher yet</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{fullName(t)}</option>)}
          </select>
        </div>
        <button type="submit">Add course</button>
      </form>
      {message && <p className="msg">{message}</p>}
      {error && <p className="error">{error}</p>}

      <h3>All courses ({courses.length})</h3>
      {loading ? <p>Loading...</p> : courses.length === 0 ? (
        <p className="empty">No courses yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Code</th><th>Course</th><th>Teacher</th><th>Students</th><th></th></tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>
                  <select value={c.teacher ?? ''} onChange={(e) => changeTeacher(c, e.target.value)}>
                    <option value="">Unassigned</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{fullName(t)}</option>)}
                  </select>
                </td>
                <td>{countFor(c.id)}</td>
                <td>
                  <div className="actions">
                    <Link className="btn-ghost" to={`/admin/courses/${c.id}`}>Manage students</Link>
                    <button className="btn-danger" onClick={() => remove(c)}>Delete</button>
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