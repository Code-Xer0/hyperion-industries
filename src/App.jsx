import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import Nav from './components/layout/Nav';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
const FoundersPage = lazy(() => import('./pages/FoundersPage'));
const FounderPage = lazy(() => import('./pages/FounderPage'));
const DistrictPage = lazy(() => import('./pages/DistrictPage'));
const CardStudioPage = lazy(() => import('./pages/CardStudioPage'));
const CardStudioDesignPage = lazy(() => import('./pages/CardStudioDesignPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const McpPage = lazy(() => import('./pages/McpPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));

// Operator-only surfaces: DEV-gated lazy imports so the production bundle
// contains neither the code nor the route — no source/route leakage.
const RadioStatsPage = import.meta.env.DEV ? lazy(() => import('./pages/RadioStatsPage')) : () => null;
const IntakePage = lazy(() => import('./features/intake/IntakePage'));
const ForgeConfiguratorPage = lazy(() => import('./features/forge-configurator/ForgeConfiguratorPage'));
const ForgeCatalogPage = lazy(() => import('./features/forge-catalog/ForgeCatalogPage'));
const ForgeBuilderPage = lazy(() => import('./features/configurator-workbench/ForgeBuilderPage'));
const PandoraRackworksPage = lazy(() => import('./features/configurator-workbench/PandoraRackworksPage'));
const PandoraLiteGridPage = lazy(() => import('./features/configurator-workbench/PandoraLiteGridPage'));
const ClientAccountPage = lazy(() => import('./features/client-account/ClientAccountPage'));
const SystemsPage = lazy(() => import('./pages/SystemsPage'));
const BuildArchivePage = lazy(() => import('./pages/BuildArchivePage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const DevDiaryPage = lazy(() => import('./pages/DevDiaryPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const EditorPage = import.meta.env.DEV ? lazy(() => import('./pages/EditorPage')) : () => null;
const CardStudioSpecimensPage = import.meta.env.DEV ? lazy(() => import('./pages/CardStudioSpecimensPage')) : () => null;
import { HelmetProvider } from 'react-helmet-async';
const AmbientCityLayer = lazy(() => import('./components/ui/AmbientCityLayer'));
import { EditorProvider, useEditor } from './context/EditorContext';
import { ThemeProvider } from './context/ThemeContext';
import { OperatorPilotProvider, useOperatorPilot } from './context/OperatorPilotContext';
import EditorModal from './components/ui/EditorModal';
const OperatorResident = lazy(() => import('./components/operator/OperatorResident'));
import SeoRouteHead from './components/seo/SeoRouteHead';
import operators from '../site-content/collections/operators.json';
import { INTAKE_LANE_SEO } from '../shared/intake/lane-seo';
import { SITE_CONTENT_PAGE_BY_PATH } from './generated/siteContent';

const PUBLIC_FOUNDER_SLUGS = new Set(operators.map((operator) => operator.slug));
const PUBLIC_INTAKE_LANES = new Set(INTAKE_LANE_SEO.map((lane) => lane.id));

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

function FounderRoute() {
  const { slug } = useParams();
  return PUBLIC_FOUNDER_SLUGS.has(slug) ? <FounderPage /> : <NotFoundPage />;
}

function IntakeLaneRoute() {
  const { lane } = useParams();
  if (lane === 'forge') return <ForgeConfiguratorPage />;
  return PUBLIC_INTAKE_LANES.has(lane) ? <IntakePage /> : <NotFoundPage />;
}

function OperatorPilotMount() {
  const { available, enabled } = useOperatorPilot();
  if (!available || !enabled) return null;
  return <Suspense fallback={null}><OperatorResident /></Suspense>;
}

function PublicFooterMount() {
  const { pathname } = useLocation();
  if (pathname === '/account' || pathname === '/intake/resume' || pathname.startsWith('/editor') || pathname.startsWith('/dev/')) return null;
  return <Footer />;
}

function ContentOrNotFoundRoute() {
  const { pathname } = useLocation();
  return SITE_CONTENT_PAGE_BY_PATH.has(pathname) ? <ContentPage /> : <NotFoundPage />;
}

export default function App() {
  const isDev = import.meta.env.DEV;

  return (
    <HelmetProvider>
      <ThemeProvider>
        <OperatorPilotProvider>
          <EditorProvider>
            <BrowserRouter>
            <Suspense fallback={null}><AmbientCityLayer /></Suspense>
            <Nav />
            <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/founders" element={<FoundersPage />} />
              <Route path="/founders/:slug" element={<FounderRoute />} />
              {isDev && <Route path="/radio-stats" element={<RadioStatsPage />} />}
              <Route path="/systems" element={<SystemsPage />} />
              <Route path="/intake" element={<IntakePage />} />
              <Route path="/intake/resume" element={<IntakePage resumeMode />} />
              <Route path="/intake/:lane" element={<IntakeLaneRoute />} />
              <Route path="/forge/catalog" element={<ForgeCatalogPage />} />
              <Route path="/forge/configurator" element={<ForgeConfiguratorPage />} />
              <Route path="/forge/configurator/build" element={<ForgeBuilderPage />} />
              <Route path="/pandora/configurator" element={<PandoraRackworksPage />} />
              <Route path="/pandora-lite/configurator" element={<PandoraLiteGridPage />} />
              <Route path="/account" element={<ClientAccountPage />} />
              <Route path="/chronos" element={<DistrictPage districtId="chronos" />} />
              <Route path="/forge" element={<DistrictPage districtId="forge" />} />
              <Route path="/pandora" element={<DistrictPage districtId="pandora" />} />
              <Route path="/talos" element={<DistrictPage districtId="talos" />} />
              <Route path="/identity" element={<DistrictPage districtId="identity" />} />
              <Route path="/mnemos" element={<DistrictPage districtId="mnemos" />} />
              <Route path="/software-estate" element={<DistrictPage districtId="software-estate" />} />
              <Route path="/succession" element={<DistrictPage districtId="succession" />} />
              <Route path="/pandora-lite" element={<DistrictPage districtId="pandora-lite" />} />
              <Route path="/architecture" element={<DistrictPage districtId="architecture" />} />
              <Route path="/alignment" element={<DistrictPage districtId="alignment" />} />
              <Route path="/build-archive" element={<BuildArchivePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/card-studio" element={<CardStudioPage />} />
              <Route path="/card-studio/design" element={<CardStudioDesignPage />} />
              <Route path="/card-studio/design/:starterId" element={<CardStudioDesignPage />} />
              <Route path="/card-studio/legacy" element={<StaticRedirect to="/card-studio" />} />
              <Route path="/card-studio/studio.html" element={<StaticRedirect to="/card-studio" />} />
              <Route path="/studio/card-studio" element={<StaticRedirect to="/card-studio" />} />
              <Route path="/dxcard" element={<StaticRedirect to="/dxcard/index.html" />} />
              <Route path="/dxcard/index.html" element={<StaticRedirect to="/dxcard" />} />
              {isDev && <Route path="/editor" element={<EditorPage />} />}
              {isDev && <Route path="/dev/card-studio-specimens" element={<CardStudioSpecimensPage />} />}
              <Route path="/dev-diary" element={<DevDiaryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/mcp" element={<McpPage />} />
              <Route path="/newsletter" element={<NewsletterPage />} />
              <Route path="/store" element={<StorePage />} />
              <Route path="*" element={<ContentOrNotFoundRoute />} />
            </Routes>
            </Suspense>
            <SeoRouteHead />
            <PublicFooterMount />
            <OperatorPilotMount />
            {isDev && <EditModeToggle />}
            {isDev && <EditorModal />}
            </BrowserRouter>
          </EditorProvider>
        </OperatorPilotProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
