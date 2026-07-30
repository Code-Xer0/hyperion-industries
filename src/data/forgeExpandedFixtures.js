const fixture = (slug, category, manufacturer, model, amountMinor, specs) => {
  const id = `HYP-PART-FIX-${slug}`;
  return {
    forge_part_id: id,
    part_revision_id: `${id}-R1`,
    revision_hash: '0'.repeat(64),
    category,
    manufacturer,
    model,
    mpn: `FIX-${slug}`,
    lifecycle_state: 'active',
    specs,
    confidence: 'manual',
    data_origin: 'sanitized_fixture',
    price: {
      currency: 'USD',
      amount_minor: amountMinor,
      unit_landed_cost_minor: amountMinor,
      condition: 'new',
      availability: 'fixture_in_stock',
      freshness: 'fixture',
      source_posture: 'fixture_only',
      not_a_quote: true,
    },
    recommendation: {
      schema_version: 'forge-catalog-ranker/1',
      score_basis_points: 5000,
      fit_posture: 'browser_preview',
      reason_codes: ['source.fixture_fallback'],
      authority: 'fallback',
    },
  };
};

const cpuRows = [
  ['CPU-R5-7600', 'AMD', 'Ryzen 5 7600', 22900, 'AM5', 65],
  ['CPU-R5-7600X', 'AMD', 'Ryzen 5 7600X', 24900, 'AM5', 105],
  ['CPU-R7-7700', 'AMD', 'Ryzen 7 7700', 31900, 'AM5', 65],
  ['CPU-R7-7700X', 'AMD', 'Ryzen 7 7700X', 34900, 'AM5', 105],
  ['CPU-R9-7900', 'AMD', 'Ryzen 9 7900', 42900, 'AM5', 65],
  ['CPU-R9-7900X', 'AMD', 'Ryzen 9 7900X', 44900, 'AM5', 170],
  ['CPU-R9-7950X3D', 'AMD', 'Ryzen 9 7950X3D', 59900, 'AM5', 120],
  ['CPU-R9-9950X', 'AMD', 'Ryzen 9 9950X', 64900, 'AM5', 170],
  ['CPU-I5-14400', 'Intel', 'Core i5-14400', 22900, 'LGA1700', 148],
  ['CPU-I5-14600K', 'Intel', 'Core i5-14600K', 31900, 'LGA1700', 181],
  ['CPU-I9-14900K', 'Intel', 'Core i9-14900K', 57900, 'LGA1700', 253],
];
const gpuRows = [
  ['GPU-RTX4060', 'NVIDIA', 'GeForce RTX 4060', 29900, 245, 2, 115],
  ['GPU-RTX4060TI', 'NVIDIA', 'GeForce RTX 4060 Ti', 39900, 250, 2, 160],
  ['GPU-RTX4070', 'NVIDIA', 'GeForce RTX 4070', 54900, 270, 2, 200],
  ['GPU-RTX4070TIS', 'NVIDIA', 'GeForce RTX 4070 Ti SUPER', 79900, 305, 3, 285],
  ['GPU-RTX4080S', 'NVIDIA', 'GeForce RTX 4080 SUPER', 99900, 310, 3, 320],
  ['GPU-RX7600XT', 'AMD', 'Radeon RX 7600 XT', 32900, 280, 2, 190],
  ['GPU-RX7700XT', 'AMD', 'Radeon RX 7700 XT', 44900, 285, 3, 245],
  ['GPU-RX7800XT', 'AMD', 'Radeon RX 7800 XT', 49900, 300, 3, 263],
  ['GPU-RX7900GRE', 'AMD', 'Radeon RX 7900 GRE', 54900, 300, 3, 260],
  ['GPU-RX7900XTX', 'AMD', 'Radeon RX 7900 XTX', 89900, 320, 3, 355],
  ['GPU-ARCA770', 'Intel', 'Arc A770 16GB', 32900, 270, 3, 225],
  ['GPU-RTX4000ADA', 'NVIDIA', 'RTX 4000 Ada Generation', 149900, 241, 1, 130],
];
const boardRows = [
  ['MB-B650-ATX', 'ASUS', 'TUF Gaming B650-PLUS WIFI', 21900, 'AM5', 'ATX', 192],
  ['MB-B650M', 'MSI', 'MAG B650M Mortar WiFi', 19900, 'AM5', 'Micro-ATX', 192],
  ['MB-B650I-AORUS', 'Gigabyte', 'B650I AORUS Ultra', 24900, 'AM5', 'Mini-ITX', 96],
  ['MB-X670E-HERO', 'ASUS', 'ROG Crosshair X670E Hero', 64900, 'AM5', 'ATX', 192],
  ['MB-X670E-TAICHI', 'ASRock', 'X670E Taichi', 49900, 'AM5', 'E-ATX', 192],
  ['MB-Z790-A', 'MSI', 'PRO Z790-A MAX WIFI', 27900, 'LGA1700', 'ATX', 192],
  ['MB-Z790M', 'ASUS', 'Prime Z790M-PLUS', 21900, 'LGA1700', 'Micro-ATX', 192],
  ['MB-Z790I', 'ASUS', 'ROG Strix Z790-I Gaming WiFi', 43900, 'LGA1700', 'Mini-ITX', 96],
  ['MB-Z790-ELITE', 'Gigabyte', 'Z790 AORUS Elite X WIFI7', 32900, 'LGA1700', 'ATX', 192],
];
const memoryRows = [
  ['RAM-DDR5-16', 'Crucial', 'Pro 16GB DDR5', 5900, 'DDR5', 16, 2],
  ['RAM-DDR5-32-C', 'Crucial', 'Pro 32GB DDR5', 9900, 'DDR5', 32, 2],
  ['RAM-DDR5-32-K', 'Kingston', 'FURY Beast 32GB DDR5', 10900, 'DDR5', 32, 2],
  ['RAM-DDR5-48', 'Corsair', 'Vengeance 48GB DDR5', 15900, 'DDR5', 48, 2],
  ['RAM-DDR5-64-K', 'Kingston', 'FURY Renegade 64GB DDR5', 22900, 'DDR5', 64, 2],
  ['RAM-DDR5-96', 'Corsair', 'Vengeance 96GB DDR5', 34900, 'DDR5', 96, 2],
  ['RAM-DDR5-128', 'Crucial', 'Pro 128GB DDR5', 52900, 'DDR5', 128, 4],
  ['RAM-DDR4-64', 'Corsair', 'Vengeance LPX 64GB DDR4', 12900, 'DDR4', 64, 2],
];
const storageRows = [
  ['SSD-1TB-990', 'Samsung', '990 PRO 1TB', 10900, 1000],
  ['SSD-4TB-990', 'Samsung', '990 PRO 4TB', 34900, 4000],
  ['SSD-1TB-SN850X', 'Western Digital', 'Black SN850X 1TB', 9900, 1000],
  ['SSD-2TB-SN850X', 'Western Digital', 'Black SN850X 2TB', 15900, 2000],
  ['SSD-1TB-T500', 'Crucial', 'T500 1TB', 8900, 1000],
  ['SSD-2TB-T500', 'Crucial', 'T500 2TB', 14900, 2000],
  ['SSD-4TB-P3P', 'Crucial', 'P3 Plus 4TB', 24900, 4000],
  ['SSD-2TB-KC3000', 'Kingston', 'KC3000 2TB', 14900, 2000],
  ['SSD-4TB-MP44', 'TeamGroup', 'MP44 4TB', 23900, 4000],
  ['SSD-8TB-FIX', 'Fixture Labs', 'Capacity Sentinel 8TB NVMe', 64900, 8000],
];
const caseRows = [
  ['CASE-4000D', 'Corsair', '4000D Airflow', 10900, ['ATX', 'Micro-ATX', 'Mini-ITX'], 360, 170],
  ['CASE-5000D', 'Corsair', '5000D Airflow', 17900, ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'], 400, 170],
  ['CASE-H7', 'NZXT', 'H7 Flow', 12900, ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'], 400, 185],
  ['CASE-H5', 'NZXT', 'H5 Flow', 9900, ['ATX', 'Micro-ATX', 'Mini-ITX'], 365, 165],
  ['CASE-LANCOOL3', 'Lian Li', 'LANCOOL III', 15900, ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'], 435, 187],
  ['CASE-O11D', 'Lian Li', 'O11 Dynamic EVO', 16900, ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'], 426, 167],
  ['CASE-AP201', 'ASUS', 'Prime AP201', 7900, ['Micro-ATX', 'Mini-ITX'], 338, 170],
  ['CASE-NR200P', 'Cooler Master', 'NR200P', 11900, ['Mini-ITX'], 330, 155],
  ['CASE-MESHROOM', 'SSUPD', 'Meshroom S', 15900, ['Mini-ITX'], 336, 74],
];
const coolerRows = [
  ['COOLER-U12A', 'Noctua', 'NH-U12A', 11900, 158, 5],
  ['COOLER-U12S', 'Noctua', 'NH-U12S redux', 5900, 158, 4],
  ['COOLER-PA120', 'Thermalright', 'Peerless Assassin 120', 3900, 157, 6],
  ['COOLER-PS120', 'Thermalright', 'Phantom Spirit 120', 4500, 154, 6],
  ['COOLER-DARKROCK5', 'be quiet!', 'Dark Rock 5', 6900, 161, 5],
  ['COOLER-AIO240', 'ARCTIC', 'Liquid Freezer III 240', 9900, 40, 12],
  ['COOLER-AIO280', 'ARCTIC', 'Liquid Freezer III 280', 11900, 40, 14],
  ['COOLER-H150I', 'Corsair', 'iCUE H150i Elite', 17900, 40, 16],
];
const psuRows = [
  ['PSU-650E', 'Corsair', 'RM650e', 9900, 650, 2],
  ['PSU-750E', 'Corsair', 'RM750e', 11900, 750, 3],
  ['PSU-1000E', 'Corsair', 'RM1000e', 17900, 1000, 5],
  ['PSU-1000X', 'Corsair', 'RM1000x SHIFT', 20900, 1000, 6],
  ['PSU-VERTEX850', 'Seasonic', 'Vertex GX-850', 16900, 850, 4],
  ['PSU-VERTEX1000', 'Seasonic', 'Vertex GX-1000', 21900, 1000, 5],
  ['PSU-SFX750', 'Corsair', 'SF750', 17900, 750, 4],
  ['PSU-SFX850', 'Cooler Master', 'V SFX Gold 850', 15900, 850, 4],
];

export const FORGE_EXPANDED_FIXTURES = [
  ...cpuRows.map(([slug, maker, model, price, socket, power]) => fixture(slug, 'cpu', maker, model, price, { socket, power_w: power })),
  ...gpuRows.map(([slug, maker, model, price, length, slots, power]) => fixture(slug, 'gpu', maker, model, price, { length_mm: length, width_slots: slots, power_w: power })),
  ...boardRows.map(([slug, maker, model, price, socket, form, maxMemory]) => fixture(slug, 'motherboard', maker, model, price, { socket, form_factor: form, memory_generation: 'DDR5', max_memory_gb: maxMemory })),
  ...memoryRows.map(([slug, maker, model, price, generation, capacity, dimms]) => fixture(slug, 'memory', maker, model, price, { memory_generation: generation, capacity_gb: capacity, dimm_count: dimms, power_w: Math.max(8, capacity / 4) })),
  ...storageRows.map(([slug, maker, model, price, capacity]) => fixture(slug, 'storage', maker, model, price, { interface: 'M2_NVME', capacity_gb: capacity, power_w: 8 })),
  ...caseRows.map(([slug, maker, model, price, forms, gpu, cooler]) => fixture(slug, 'case', maker, model, price, { supported_form_factors: forms, max_gpu_length_mm: gpu, max_cooler_height_mm: cooler })),
  ...coolerRows.map(([slug, maker, model, price, height, power]) => fixture(slug, 'cooler', maker, model, price, { supported_sockets: ['AM5', 'LGA1700'], height_mm: height, power_w: power })),
  ...psuRows.map(([slug, maker, model, price, wattage, pcie]) => fixture(slug, 'psu', maker, model, price, { wattage, connectors: { PCIE8: pcie, '12V2X6': 1 } })),
];
