import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import KioskPage from './pages/KioskPage';
import ParentPage from './pages/ParentPage';
import AdminPage from './pages/AdminPage';
import { Toaster } from './components/ui/sonner';
import './index.css';

function App() {
  return (
    <Router>
      <div dir="rtl" className="font-sans">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/parent" element={<ParentPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <Toaster richColors />
      </div>
    </Router>
  );
}

export default App;
