import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Upload from './pages/Upload';
import ResumeList from './pages/ResumeList';
import ResumeDetail from './pages/ResumeDetail';
import JobProfiles from './pages/JobProfiles';
import JobProfileCreate from './pages/JobProfileCreate';
import JobProfileDetail from './pages/JobProfileDetail';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-ds-bg">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/resumes" replace />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/resumes" element={<ResumeList />} />
            <Route path="/resumes/:id" element={<ResumeDetail />} />
            <Route path="/jobs" element={<JobProfiles />} />
            <Route path="/jobs/new" element={<JobProfileCreate />} />
            <Route path="/jobs/:id" element={<JobProfileDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
