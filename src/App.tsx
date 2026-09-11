import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicProfile from './pages/PublicProfile';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import ProfileEditor from './pages/admin/ProfileEditor';
import ManageLinks from './pages/admin/ManageLinks';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Microsite */}
        <Route path="/:username" element={<PublicProfile />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/profile" replace />} />
          <Route path="profile" element={<ProfileEditor />} />
          <Route path="links" element={<ManageLinks />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/solarhijab" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
