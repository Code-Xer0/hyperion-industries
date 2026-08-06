import { useLocation } from 'react-router-dom';
import BlockRenderer from '../components/content/BlockRenderer';
import PageShell from '../components/layout/PageShell';
import { SITE_CONTENT_PAGE_BY_PATH, SITE_CONTENT_THEME_BY_ID } from '../generated/siteContent';

export function getContentPage(pathname) {
  return SITE_CONTENT_PAGE_BY_PATH.get(pathname) || null;
}

export default function ContentPage() {
  const { pathname } = useLocation();
  const page = getContentPage(pathname);
  if (!page) return null;
  const theme = SITE_CONTENT_THEME_BY_ID.get(page.theme_ref);
  return (
    <PageShell>
      <main
        className="builder-content-page"
        data-builder-page={page.id}
        data-theme-accent={theme?.tokens.accent}
        data-theme-motion={theme?.tokens.motion}
      >
        <BlockRenderer blocks={page.blocks} />
      </main>
    </PageShell>
  );
}
