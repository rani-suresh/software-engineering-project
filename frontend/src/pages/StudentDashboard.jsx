import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import Icon from '../components/Icons';
import ProgressRing from '../components/ProgressRing';

const level = (p) => (p == null ? 'none' : p >= 75 ? 'good' : p >= 60 ? 'mid' : 'bad');

export default function StudentDashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/my-attendance/'), api.get('/ai/my-insights/')])
      .then(([a, i]) => {
        setRows(a.data);
        setInsights(i.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((s, r) => s + r.total_sessions, 0);
  const attended = rows.reduce((s, r) => s + r.attended, 0);
  const overall = total ? (attended / total) * 100 : null;
  const atRisk = rows.filter((r) => r.percentage !== null && r.percentage < 75).length;
  const firstName = user.name.split(' ')[0];

  let headline = 'No classes recorded yet';
  let detail = 'Your attendance will appear here once your teachers start marking classes.';
  if (overall !== null && atRisk === 0) {
    headline = "You're on track";
    detail = 'All your courses are above the 75% attendance requirement. Keep it up!';
  } else if (overall !== null) {
    headline = `${atRisk} course${atRisk > 1 ? 's need' : ' needs'} your attention`;
    detail = 'Attendance below 75% can put your exam eligibility at risk. Try not to miss any more classes.';
  }

  return (
    <Layout title={`Hello, ${firstName}!`} plain>
      {loading ? <p>Loading...</p> : (
        <>
          <div className="banner">
            <div>
              <h2>{headline}</h2>
              <p>{detail}</p>
            </div>
            {overall !== null && <div className="banner-pill">{Math.round(overall)}% overall</div>}
          </div>

          <div className="grid">
            <div className="left">
              <div className="card">
                <h3>My courses</h3>
                {rows.length === 0 ? <p>You are not enrolled in any courses yet.</p> : rows.map((r) => (
                  <div className={`course ${level(r.percentage)}`} key={r.course_id}>
                    <div className="course-top">
                      <strong>{r.course}</strong>
                      <span className={`badge ${level(r.percentage)}`}>
                        {r.percentage === null ? 'No classes yet' : `${r.percentage}%`}
                      </span>
                    </div>
                    <div className="bar">
                      <div className={`bar-fill ${level(r.percentage)}`}
                           style={{ width: `${r.percentage ?? 0}%` }} />
                    </div>
                    <small>{r.attended} of {r.total_sessions} classes attended · {r.absent} absent</small>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3>Smart tips</h3>
                {insights.length === 0 ? (
                  <p className="empty">Tips will appear once classes have been recorded.</p>
                ) : insights.map((i) => (
                  <div className={`tip ${i.level}`} key={i.course_id}>
                    <strong>{i.course}</strong>
                    <span>{i.tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="side">
              <div className="stat blue">
                <div className="stat-head">
                  <span className="stat-icon"><Icon name="check" /></span> Overall attendance
                </div>
                <div className="stat-ring"><ProgressRing value={overall} /></div>
              </div>
              <div className="stat teal">
                <div className="stat-head">
                  <span className="stat-icon"><Icon name="calendar" /></span> Classes attended
                </div>
                <div className="stat-num">{attended}<span> / {total}</span></div>
              </div>
              <div className="stat indigo">
                <div className="stat-head">
                  <span className="stat-icon"><Icon name="alert" /></span> Courses below 75%
                </div>
                <div className="stat-num">{atRisk}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}