import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CircuitBoard,
  Database,
  Layers3,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  FORGE_PRODUCT_AUTHORITY_NOTICE,
  FORGE_PRODUCT_FALLBACK,
  isForgeProductBundle,
} from '../../data/forgeProductViews';
import './ForgeCatalogPage.css';

const SOURCE_COPY = {
  airtable_curated: {
    label: 'Airtable curated',
    detail: 'Presentation copy is curated in Airtable; engineering lineage remains anchored in HypOM.',
  },
  bundled_fallback: {
    label: 'Bundled catalog',
    detail: 'Showing the last verified public projection while the optional Airtable presentation layer is offline.',
  },
};

async function loadCatalog(signal) {
  const response = await fetch('/api/forge/products', {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  });
  if (!response.ok) throw new Error('catalog_unavailable');
  const payload = await response.json();
  if (!isForgeProductBundle(payload)) throw new Error('catalog_invalid');
  return payload;
}

function ProductMedia({ product }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="forge-catalog-media-fallback" role="img" aria-label={`${product.title} media unavailable`}>
        <CircuitBoard aria-hidden="true" />
        <span>Field media unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={product.media.path}
      alt={product.media.alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCard({ product }) {
  return (
    <article className="forge-product-card" data-lane={product.lane}>
      <div className="forge-product-media">
        <ProductMedia product={product} />
        <div className="forge-product-media-shade" />
        <span className="forge-product-index">{String(product.display_order / 10).padStart(2, '0')}</span>
        <div className="forge-product-badges" aria-label="Product posture">
          {product.badges.slice(0, 2).map((badge) => <span key={badge}>{badge}</span>)}
        </div>
      </div>
      <div className="forge-product-body">
        <p className="forge-product-eyebrow">{product.eyebrow}</p>
        <h2>{product.title}</h2>
        <p className="forge-product-summary">{product.summary}</p>
        <div className="forge-product-tags" aria-label="Workload tags">
          {product.workload_tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <ul className="forge-product-highlights">
          {product.highlights.map((highlight) => (
            <li key={highlight}><Check size={15} aria-hidden="true" />{highlight}</li>
          ))}
        </ul>
        <div className="forge-product-card-foot">
          <span>
            <ShieldCheck size={16} aria-hidden="true" />
            Scoped after operator review
          </span>
          <Link to={`/forge/configurator?lane=${encodeURIComponent(product.lane)}&source=catalog`}>
            Shape this lane <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ForgeCatalogPage() {
  const [catalog, setCatalog] = useState(FORGE_PRODUCT_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [activeLane, setActiveLane] = useState('all');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);
    loadCatalog(controller.signal)
      .then(setCatalog)
      .catch(() => setCatalog(FORGE_PRODUCT_FALLBACK))
      .finally(() => {
        window.clearTimeout(timeout);
        setLoading(false);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const lanes = useMemo(() => [
    { id: 'all', label: 'All systems' },
    ...catalog.items.map((item) => ({ id: item.lane, label: item.lane.replace('-', ' ') })),
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index), [catalog]);

  const visibleProducts = activeLane === 'all'
    ? catalog.items
    : catalog.items.filter((product) => product.lane === activeLane);
  const source = SOURCE_COPY[catalog.source_posture] || SOURCE_COPY.bundled_fallback;

  return (
    <main className="forge-catalog-page">
      <Helmet>
        <title>Forge Systems Catalog | Hyperion Industries</title>
        <meta name="description" content="Explore Hyperion Forge gaming, creator, local-AI, compact, and custom-loop system lanes before operator review." />
        <link rel="canonical" href="https://hyperion-industries.dev/forge/catalog" />
      </Helmet>

      <section className="forge-catalog-hero">
        <div className="forge-catalog-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div className="forge-catalog-hero-copy">
          <p><Sparkles size={15} aria-hidden="true" /> HYPOM PRODUCT PROJECTION // PUBLIC EDGE</p>
          <h1>Systems shaped around <em>the work.</em></h1>
          <p className="forge-catalog-intro">
            These are engineering lanes, not shelf SKUs. Each begins with a validated system pattern,
            then gets rebuilt around workload, room, service posture, evidence, and budget.
          </p>
          <div className="forge-catalog-actions">
            <Link className="is-primary" to="/forge/configurator">Open the configurator <ArrowRight size={17} /></Link>
            <Link to="/build-archive">See physical build proof</Link>
          </div>
        </div>
        <div className="forge-catalog-hero-telemetry" aria-label="Catalog posture">
          <div><span>System lanes</span><strong>{catalog.items.length}</strong></div>
          <div><span>Pricing</span><strong>Scoped</strong></div>
          <div><span>Authority</span><strong>HypOM</strong></div>
        </div>
      </section>

      <section className="forge-catalog-control" aria-label="Catalog controls">
        <div className="forge-catalog-source">
          <span className={catalog.source_posture === 'airtable_curated' ? 'is-live' : ''}>
            <Database size={15} aria-hidden="true" /> {loading ? 'Syncing catalog' : source.label}
          </span>
          <p>{source.detail}</p>
        </div>
        <div className="forge-catalog-filters">
          <span><SlidersHorizontal size={15} aria-hidden="true" /> Filter by lane</span>
          <div role="group" aria-label="Filter systems by workload lane">
            {lanes.map((lane) => (
              <button
                key={lane.id}
                type="button"
                className={activeLane === lane.id ? 'is-active' : ''}
                onClick={() => setActiveLane(lane.id)}
                aria-pressed={activeLane === lane.id}
              >
                {lane.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="forge-product-grid" aria-live="polite" aria-busy={loading}>
        {visibleProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
      </section>

      <section className="forge-catalog-boundary">
        <div>
          <Layers3 size={26} aria-hidden="true" />
          <span>Projection boundary</span>
          <h2>A starting architecture, never an inventory promise.</h2>
        </div>
        <p>{catalog.authority_notice || FORGE_PRODUCT_AUTHORITY_NOTICE}</p>
        <ul>
          <li>No copied customer or relationship truth</li>
          <li>No public BOM, live inventory, or checkout</li>
          <li>Every final configuration and quote requires review</li>
        </ul>
      </section>
    </main>
  );
}
