export const KAIRO_SCORE_TRACKS = [
  { id: 'succession', title: 'Succession', audio: '/assets/radio/succession.mp3' },
  { id: 'tesseract', title: 'Tesseract', audio: '/assets/radio/tesseract.mp3' },
  { id: 'future-call', title: 'Future Call', audio: '/assets/radio/future-call.mp3' },
];

export function pickKairoScore() {
  return KAIRO_SCORE_TRACKS[Math.floor(Math.random() * KAIRO_SCORE_TRACKS.length)];
}
