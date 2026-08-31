export const HYPERION_MEDIA_MANIFEST = Object.freeze({
  contract_version: 'hyperion-media-manifest/1',
  generated_at: '2026-08-30T23:33:00.000Z',
  policy: Object.freeze({
    initial_route_media_budget_bytes: 2_000_000,
    autoplay_audio: false,
    concurrent_active_cinematics: 1,
    reduced_motion_fallback: 'poster',
    save_data_fallback: 'poster',
  }),
  assets: Object.freeze({
    city_gate: Object.freeze({
      id: 'city-gate-cinematic',
      route: '/',
      video: '/assets/city/hyperion-city-mark.mp4',
      sources: Object.freeze([
        Object.freeze({ src: '/assets/city/hyperion-city-mark.mp4', type: 'video/mp4' }),
      ]),
      poster: '/assets/cinematic-v2/hyperion-city-company-hero.webp',
      external_poster_id: 'city-gate-boot-poster',
      poster_width: 1920,
      poster_height: 1080,
      width: 1920,
      height: 1080,
      duration_ms: 10_000,
      video_bytes: 8_651_179,
      poster_bytes: 130_744,
      preload: 'none',
      activation: 'explicit_intent',
      alternate_format_posture: 'poster_fallback_until_reviewed_webm_master_exists',
      focal_point: '50% 50%',
    }),
    generated_posters: Object.freeze([
      Object.freeze({ id: 'hyperion-company-city', route: '/', src: '/assets/cinematic-v2/hyperion-city-company-hero.webp', width: 1920, height: 1080, bytes: 130_744, sha256: 'f66db9f7cb28ec25f06fda6317812acfc8a2ac9afca5b679e6f5ee4f1a22ab51', role: 'cinematic_concept_not_product_evidence', provenance: 'OpenAI image generation · 2026-08-30' }),
      Object.freeze({ id: 'forge-lab-keyframe', route: '/forge', src: '/assets/cinematic-v2/forge-lab-keyframe.webp', width: 1920, height: 1080, bytes: 124_948, sha256: '77f09d17cb50622f9c3f42fc509360ccec05cbac7da66df2549567e24e554bb4', role: 'cinematic_concept_not_product_evidence', provenance: 'OpenAI image generation · 2026-08-30' }),
      Object.freeze({ id: 'chronos-archive-observatory', route: '/chronos', src: '/assets/cinematic-v2/chronos-archive-observatory.webp', width: 1920, height: 1080, bytes: 62_700, sha256: '3c6a15b32edbe3da3541f604b6004bbe166aefb8ceca69838819be08c1bf3fb4', role: 'cinematic_concept_not_product_evidence', provenance: 'OpenAI image generation · 2026-08-30' }),
      Object.freeze({ id: 'live-site-studio', route: '/services', src: '/assets/cinematic-v2/live-site-studio.webp', width: 1920, height: 1080, bytes: 67_430, sha256: '8b6cb2e9bcf80c8810d34d68cb03cfbe58d11e814064a48af05eb4fa2a4f821e', role: 'cinematic_concept_not_product_evidence', provenance: 'OpenAI image generation · 2026-08-30' }),
    ]),
    forge: Object.freeze([
      ['gaming', 'Custom performance systems', 'hyperion-custom-workstation-card', 14_000, 4_195_075, 38_913],
      ['creator', 'Creator and studio systems', 'hyperion-workspace-systems-card', 16_000, 3_873_697, 72_949],
      ['local-ai', 'Local AI and private compute', 'hyperion-gpu-telemetry-card', 14_000, 2_782_285, 76_446],
      ['sff', 'Small-form-factor systems', 'hyperion-workstation-core-card', 14_000, 5_090_000, 101_299],
      ['custom-loop', 'Custom loop and showcase systems', 'hyperion-operator-environment-card', 17_000, 5_751_247, 70_203],
    ].map(([lane, label, asset, duration_ms, video_bytes, poster_bytes]) => Object.freeze({
      id: `forge-${lane}`,
      lane,
      label,
      route: '/forge',
      video: `/assets/forge/media-v1/cards/${asset}.mp4`,
      sources: Object.freeze([
        Object.freeze({ src: `/assets/forge/media-v1/cards/${asset}.mp4`, type: 'video/mp4' }),
      ]),
      poster: `/assets/forge/media-v1/posters/${asset}.jpg`,
      width: 720,
      height: 900,
      duration_ms,
      video_bytes,
      poster_bytes,
      preload: 'none',
      activation: 'viewport_and_intent',
      alternate_format_posture: 'poster_fallback_until_reviewed_webm_master_exists',
      focal_point: '50% 50%',
    }))),
  }),
});

export const forgeMediaForLane = (lane) => (
  HYPERION_MEDIA_MANIFEST.assets.forge.find((item) => item.lane === lane)
  || HYPERION_MEDIA_MANIFEST.assets.forge[0]
);
