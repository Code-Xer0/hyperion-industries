import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { DistrictLayout } from '../components/portal/PortalPrimitives';
import { getDistrict } from '../data/publicCity';

export default function DistrictPage({ districtId }) {
  const district = getDistrict(districtId);

  if (!district) {
    return (
      <PageShell>
        <section className="district-section">
          <div className="shell">
            <h1>District unavailable</h1>
            <p>This public route is not mapped yet.</p>
            <Link to="/" className="btn btn-gold">Return to Gate</Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell className={`district-page district-page-${district.id}`}>
      <Helmet>
        <title>{district.seoTitle}</title>
        <meta name="description" content={district.seoDescription} />
        <link rel="canonical" href={`https://hyperion-industries.dev${district.path}`} />
        <meta property="og:title" content={district.seoTitle} />
        <meta property="og:description" content={district.seoDescription} />
        <meta property="og:type" content="website" />
      </Helmet>
      <DistrictLayout district={district} />
    </PageShell>
  );
}
