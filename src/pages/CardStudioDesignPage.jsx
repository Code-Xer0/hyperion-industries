import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CARD_EXAMPLE_BY_ID, CARD_TEMPLATE_BY_ID } from '../../shared/card-studio/studio-catalog.js';
import CardStudioEditor from '../features/card-studio/CardStudioEditor.jsx';

export default function CardStudioDesignPage() {
  const { starterId = '' } = useParams();
  const allowlistedStarter = CARD_TEMPLATE_BY_ID.has(starterId) || CARD_EXAMPLE_BY_ID.has(starterId)
    ? starterId
    : '';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [allowlistedStarter]);

  return (
    <main className="page-active">
      <Helmet>
        <title>Card Studio Designer | Hyperion Industries</title>
        <meta name="description" content="Create a device-local Hyperion card brief with guarded front, back, and digital proofs." />
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href="https://hyperion-industries.dev/card-studio/design" />
      </Helmet>
      <CardStudioEditor starterId={allowlistedStarter} />
    </main>
  );
}
