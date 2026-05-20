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
import { HelmetProvider } from 'react-helmet-async';
import SingularityBackground from './components/ui/SingularityBackground';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <SingularityBackground />
        <Nav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/systems" element={<SystemsPage />} />
          <Route path="/forge" element={<ForgePage />} />
          <Route path="/build-archive" element={<BuildArchivePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/dev-diary" element={<DevDiaryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/newsletter" element={<NewsletterPage />} />
          <Route path="/store" element={<StorePage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  );
}
