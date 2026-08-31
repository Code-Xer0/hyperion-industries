import './OperatorMascot.css';

const frames = [0, 1, 2, 3].map(
  (frame) => `/assets/city/operator/operator-wave-${String(frame).padStart(4, '0')}.webp`,
);

export default function OperatorMascot() {
  return (
    <div className="operator-mascot" aria-label="Hyperion Operator mascot waving">
      {frames.map((src, index) => <img key={src} src={src} alt={index === 0 ? 'Hyperion Operator mascot waving' : ''} draggable="false" style={{ '--operator-frame': index }} />)}
    </div>
  );
}
