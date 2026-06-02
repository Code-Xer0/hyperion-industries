import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/layout/Nav';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import SystemsPage from './pages/SystemsPage';
import ForgePage from './pages/ForgePage';
import BuildArchivePage from './pages/BuildArchivePage';
import GalleryPage from './pages/GalleryPage';
import DevDiaryPage from './pages/DevDiaryPage';
import ContactPage from './pages/ContactPage';
import NewsletterPage from './pages/NewsletterPage';
import StorePage from './pages/StorePage';
import EditorPage from './pages/EditorPage';
import CardStudioPage from './pages/CardStudioPage';
import { HelmetProvider } from 'react-helmet-async';
import SingularityBackground from './components/ui/SingularityBackground';
import { EditorProvider, useEditor } from './context/EditorContext';
import { ThemeProvider } from './context/ThemeContext';
import EditorModal from './components/ui/EditorModal';

function EditModeToggle() {
  const { isEditMode, setIsEditMode } = useEditor();
  return (
    <button
      onClick={() => setIsEditMode(!isEditMode)}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: isEditMode ? '#ffc72c' : '#14171d',
        color: isEditMode ? '#000' : '#8b8d96',
        border: '1px solid',
        borderColor: isEditMode ? '#ffc72c' : 'rgba(255,255,255,0.1)',
        borderRadius: '100px',
        padding: '10px 20px',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font-display, monospace)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
    </button>
  );
}

function StaticRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}

export default function App() {
  const isDev = import.meta.env.DEV;

  return (
    <HelmetProvider>
      <ThemeProvider>
        <EditorProvider>
          <BrowserRouter>
            <SingularityBackground />
            <Nav />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/systems" element={<SystemsPage />} />
              <Route path="/forge" element={<ForgePage />} />
              <Route path="/build-archive" element={<BuildArchivePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/card-studio" element={<CardStudioPage />} />
              <Route path="/dxcard/*" element={<StaticRedirect to="/dxcard/index.html" />} />
              {isDev && <Route path="/editor" element={<EditorPage />} />}
              <Route path="/dev-diary" element={<DevDiaryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/newsletter" element={<NewsletterPage />} />
              <Route path="/store" element={<StorePage />} />
            </Routes>
            <Footer />
            {isDev && <EditModeToggle />}
            {isDev && <EditorModal />}
          </BrowserRouter>
        </EditorProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
