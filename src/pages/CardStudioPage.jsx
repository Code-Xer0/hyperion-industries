import { Helmet } from 'react-helmet-async';
import CardStudioEditor from '../features/card-studio/CardStudioEditor.jsx';
import './CardStudioPage.css';

export default function CardStudioPage() {
  return (
    <main className="page-active card-studio-page">
      <Helmet>
        <title>Hyperion Card Studio Invite Preview | Smart Operator Identity</title>
        <meta
          name="description"
          content="Compose a guarded operator-card design brief with live front, back, and digital proofs in Hyperion's invite-only soft-launch lane."
        />
        <link rel="canonical" href="https://hyperion-industries.dev/card-studio" />
      </Helmet>
      <CardStudioEditor />
    </main>
  );
}
