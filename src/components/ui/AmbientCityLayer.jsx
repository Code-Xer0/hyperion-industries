import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCityAmbientProfile } from '../../data/cityNavigation';
import SingularityBackground from './SingularityBackground';

export default function AmbientCityLayer() {
  const { pathname } = useLocation();
  const ambient = getCityAmbientProfile(pathname);
  const founderOwnsCanvas = pathname.startsWith('/founders/');

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ambient-primary', `rgb(${ambient.primary})`);
    root.style.setProperty('--ambient-secondary', `rgb(${ambient.secondary})`);
    root.dataset.cityAmbient = ambient.id;
  }, [ambient.id, ambient.primary, ambient.secondary]);

  // Founder dossiers own their bespoke canvas and pointer-lighting system.
  if (founderOwnsCanvas) return null;

  return (
    <SingularityBackground
      color={ambient.primary}
      secondaryColor={ambient.secondary}
      intensity={ambient.intensity}
      density={1}
      speed={0.72}
      interactive
      dataAmbient={ambient.id}
      style={{ opacity: 'var(--ambient-canvas-opacity)' }}
    />
  );
}
