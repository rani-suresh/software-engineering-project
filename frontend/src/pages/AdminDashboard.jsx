import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import Icon from '../components/Icons';

export default function AdminDashboard() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/users/?role=student'),
      api.get('/users/?role=teacher'),
      api.get('/courses/'),
      api.get('/enrollments/'),
    ]).then(([s, t, c, e]) =>
      setCounts({
        students: s.data.length,
        teachers: t.data.length,
        courses: c.data.length,
        enrollments: e.data.length,
      })
    );
  }, []);

  const cards = counts && [
    { label: 'Students', value: counts.students, icon: 'users', cls: 'blue' },
    { label: 'Teachers', value: counts.teachers, icon: 'user', cls: 'teal' },
    { label: 'Courses', value: counts.courses, icon: 'book', cls: 'indigo' },
    { label: 'Enrollments', value: counts.enrollments, icon: 'check', cls: 'blue' },
  ];

  return (
    <Layout title="Admin Dashboard" plain>
      {!counts ? <p>Loading...</p> : (
        <>
          <div className="stats-row">
            {cards.map((c) => (
              <div className={`stat ${c.cls}`} key={c.label}>
                <div className="stat-head">
                  <span className="stat-icon"><Icon name={c.icon} /></span> {c.label}
                </div>
                <div className="stat-num">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Setting up a new term</h3>
            <ol className="steps">
              <li>Add your teachers</li>
              <li>Add your students</li>
              <li>Create courses and assign a teacher to each</li>
              <li>Open a course and enroll its students</li>
            </ol>
            <div className="actions">
              <Link className="btn-ghost" to="/admin/teachers">Manage teachers</Link>
              <Link className="btn-ghost" to="/admin/students">Manage students</Link>
              <Link className="btn-ghost" to="/admin/courses">Manage courses</Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}