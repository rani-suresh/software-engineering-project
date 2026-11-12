import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourse from './pages/TeacherCourse';
import MarkAttendance from './pages/MarkAttendance';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminCourses from './pages/AdminCourses';
import AdminCourseDetail from './pages/AdminCourseDetail';

const admin = (el) => <ProtectedRoute role="admin">{el}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />

        <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/course/:courseId" element={<ProtectedRoute role="teacher"><TeacherCourse /></ProtectedRoute>} />
        <Route path="/teacher/session/:sessionId" element={<ProtectedRoute role="teacher"><MarkAttendance /></ProtectedRoute>} />

        <Route path="/admin" element={admin(<AdminDashboard />)} />
        <Route path="/admin/students" element={admin(<AdminUsers key="student" role="student" />)} />
        <Route path="/admin/teachers" element={admin(<AdminUsers key="teacher" role="teacher" />)} />
        <Route path="/admin/courses" element={admin(<AdminCourses />)} />
        <Route path="/admin/courses/:courseId" element={admin(<AdminCourseDetail />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}