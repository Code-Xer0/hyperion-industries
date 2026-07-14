import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import {
  buildStructuredData,
  DEFAULT_OG_IMAGE,
  getSeoRoute,
  SITE_ORIGIN,
} from '../../data/seoRoutes';

const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

export default function SeoRouteHead() {
  const { pathname } = useLocation();
  const route = getSeoRoute(pathname);

  if (!route) {
    return (
      <Helmet>
        <title>Route Not Found | Hyperion Industries</title>
        <meta name="description" content="The requested public Hyperion route does not exist." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
    );
  }

  const image = new URL(route.ogImage || DEFAULT_OG_IMAGE, SITE_ORIGIN).href;
  const robots = route.indexable ? INDEX_ROBOTS : 'noindex,follow';
  const schema = buildStructuredData(route);

  return (
    <Helmet>
      <title>{route.title}</title>
      <meta name="description" content={route.description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={route.canonical} />
      <meta property="og:site_name" content="Hyperion Industries" />
      <meta property="og:title" content={route.title} />
      <meta property="og:description" content={route.description} />
      <meta property="og:type" content={route.schemaType === 'ProfilePage' ? 'profile' : 'website'} />
      <meta property="og:url" content={route.canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${route.title} — Hyperion Industries`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={route.title} />
      <meta name="twitter:description" content={route.description} />
      <meta name="twitter:image" content={image} />
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
