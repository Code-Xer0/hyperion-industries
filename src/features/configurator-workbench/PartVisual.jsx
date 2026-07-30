import './PartVisual.css';

const ROLE_LABELS = {
  cpu: 'processor',
  motherboard: 'motherboard',
  memory: 'memory module',
  gpu: 'graphics card',
  storage: 'storage drive',
  case: 'PC case',
  cooler: 'CPU cooler',
  psu: 'power supply',
  rack_enclosure: 'rack enclosure',
  compute_node: 'rack compute node',
  accelerator: 'rack accelerator',
  storage_shelf: 'rack storage shelf',
  network_switch: 'network switch',
  management_node: 'management node',
  rack_pdu: 'rack power distribution unit',
  lite_node: 'Lite Grid node',
  lite_switch: 'Lite Grid switch',
  lite_frame: 'Lite Grid frame',
  lite_power_hub: 'Lite Grid power hub',
};

const KNOWN_ROLES = new Set(Object.keys(ROLE_LABELS));

function Elements({ count, className }) {
  return Array.from({ length: count }, (_, index) => (
    <i className={className} key={index} />
  ));
}

function ForgeGeometry({ role }) {
  switch (role) {
    case 'cpu':
      return (
        <div className="pv-cpu pv-object">
          <i className="pv-cpu-lid" />
          <i className="pv-cpu-mark" />
          <i className="pv-cpu-edge pv-cpu-edge-a" />
          <i className="pv-cpu-edge pv-cpu-edge-b" />
          <div className="pv-cpu-pins"><Elements count={16} className="pv-pin" /></div>
        </div>
      );
    case 'motherboard':
      return (
        <div className="pv-board pv-object">
          <i className="pv-board-trace pv-board-trace-a" />
          <i className="pv-board-trace pv-board-trace-b" />
          <i className="pv-board-trace pv-board-trace-c" />
          <i className="pv-board-socket" />
          <i className="pv-board-heatsink pv-board-heatsink-a" />
          <i className="pv-board-heatsink pv-board-heatsink-b" />
          <div className="pv-board-ram"><Elements count={4} className="pv-board-slot" /></div>
          <div className="pv-board-pcie"><Elements count={3} className="pv-board-pcie-slot" /></div>
          <div className="pv-board-io"><Elements count={5} className="pv-board-port" /></div>
        </div>
      );
    case 'memory':
      return (
        <div className="pv-memory pv-object">
          <i className="pv-memory-edge" />
          <div className="pv-memory-chips"><Elements count={6} className="pv-memory-chip" /></div>
          <div className="pv-memory-contacts"><Elements count={12} className="pv-memory-contact" /></div>
        </div>
      );
    case 'gpu':
      return (
        <div className="pv-gpu pv-object">
          <i className="pv-gpu-top" />
          <div className="pv-gpu-fans">
            <i className="pv-fan"><b /><b /><b /><b /><b /><b /></i>
            <i className="pv-fan"><b /><b /><b /><b /><b /><b /></i>
          </div>
          <i className="pv-gpu-bracket" />
          <div className="pv-gpu-vents"><Elements count={5} className="pv-gpu-vent" /></div>
          <div className="pv-gpu-contacts"><Elements count={12} className="pv-gpu-contact" /></div>
        </div>
      );
    case 'storage':
      return (
        <div className="pv-storage pv-object">
          <i className="pv-storage-label" />
          <div className="pv-storage-chips"><Elements count={4} className="pv-storage-chip" /></div>
          <i className="pv-storage-controller" />
          <div className="pv-storage-contacts"><Elements count={7} className="pv-storage-contact" /></div>
        </div>
      );
    case 'case':
      return (
        <div className="pv-case pv-object">
          <i className="pv-case-top" />
          <i className="pv-case-side" />
          <i className="pv-case-glass" />
          <div className="pv-case-fans">
            <i className="pv-ring" />
            <i className="pv-ring" />
          </div>
          <i className="pv-case-shroud" />
          <i className="pv-case-foot pv-case-foot-a" />
          <i className="pv-case-foot pv-case-foot-b" />
        </div>
      );
    case 'cooler':
      return (
        <div className="pv-cooler pv-object">
          <div className="pv-cooler-fins"><Elements count={8} className="pv-cooler-fin" /></div>
          <i className="pv-cooler-fan"><b /><b /><b /><b /><b /><b /></i>
          <i className="pv-cooler-base" />
          <i className="pv-cooler-pipe pv-cooler-pipe-a" />
          <i className="pv-cooler-pipe pv-cooler-pipe-b" />
        </div>
      );
    case 'psu':
      return (
        <div className="pv-psu pv-object">
          <i className="pv-psu-top" />
          <i className="pv-psu-side" />
          <i className="pv-psu-fan"><b /><b /><b /><b /></i>
          <div className="pv-psu-sockets"><Elements count={6} className="pv-psu-socket" /></div>
          <i className="pv-psu-switch" />
        </div>
      );
    default:
      return null;
  }
}

function RackGeometry({ role }) {
  switch (role) {
    case 'rack_enclosure':
      return (
        <div className="pv-rack pv-object">
          <i className="pv-rack-top" />
          <i className="pv-rack-side" />
          <i className="pv-rack-rail pv-rack-rail-a" />
          <i className="pv-rack-rail pv-rack-rail-b" />
          <div className="pv-rack-units"><Elements count={9} className="pv-rack-unit" /></div>
          <i className="pv-rack-foot pv-rack-foot-a" />
          <i className="pv-rack-foot pv-rack-foot-b" />
        </div>
      );
    case 'compute_node':
    case 'management_node':
      return (
        <div className={`pv-server pv-object ${role === 'management_node' ? 'is-management' : ''}`}>
          <i className="pv-server-top" />
          <i className="pv-server-side" />
          <div className="pv-server-bays"><Elements count={role === 'management_node' ? 4 : 8} className="pv-server-bay" /></div>
          <div className="pv-server-status"><Elements count={3} className="pv-status-light" /></div>
          <i className="pv-server-display" />
          <i className="pv-server-handle pv-server-handle-a" />
          <i className="pv-server-handle pv-server-handle-b" />
        </div>
      );
    case 'accelerator':
      return (
        <div className="pv-accelerator pv-object">
          <i className="pv-accelerator-shell" />
          <div className="pv-accelerator-cores"><Elements count={3} className="pv-accelerator-core" /></div>
          <div className="pv-accelerator-vents"><Elements count={9} className="pv-accelerator-vent" /></div>
          <i className="pv-accelerator-bracket" />
          <div className="pv-accelerator-contacts"><Elements count={14} className="pv-accelerator-contact" /></div>
        </div>
      );
    case 'storage_shelf':
      return (
        <div className="pv-shelf pv-object">
          <i className="pv-shelf-top" />
          <i className="pv-shelf-side" />
          <div className="pv-shelf-drives"><Elements count={12} className="pv-shelf-drive" /></div>
          <i className="pv-shelf-handle pv-shelf-handle-a" />
          <i className="pv-shelf-handle pv-shelf-handle-b" />
        </div>
      );
    case 'network_switch':
      return (
        <div className="pv-switch pv-object">
          <i className="pv-switch-top" />
          <i className="pv-switch-side" />
          <div className="pv-switch-ports"><Elements count={16} className="pv-switch-port" /></div>
          <div className="pv-switch-lights"><Elements count={8} className="pv-status-light" /></div>
          <i className="pv-switch-console" />
        </div>
      );
    case 'rack_pdu':
      return (
        <div className="pv-pdu pv-object">
          <i className="pv-pdu-side" />
          <i className="pv-pdu-display" />
          <div className="pv-pdu-outlets"><Elements count={7} className="pv-pdu-outlet" /></div>
          <i className="pv-pdu-cord" />
        </div>
      );
    default:
      return null;
  }
}

function LiteGeometry({ role }) {
  switch (role) {
    case 'lite_node':
      return (
        <div className="pv-lite-node pv-object">
          <i className="pv-lite-node-top" />
          <i className="pv-lite-node-side" />
          <i className="pv-lite-node-face" />
          <div className="pv-lite-node-vents"><Elements count={8} className="pv-lite-vent" /></div>
          <i className="pv-lite-node-ring" />
          <div className="pv-lite-node-ports"><Elements count={3} className="pv-lite-port" /></div>
        </div>
      );
    case 'lite_switch':
      return (
        <div className="pv-lite-switch pv-object">
          <i className="pv-lite-switch-top" />
          <i className="pv-lite-switch-side" />
          <div className="pv-lite-switch-ports"><Elements count={8} className="pv-lite-port" /></div>
          <div className="pv-lite-switch-status"><Elements count={4} className="pv-status-light" /></div>
        </div>
      );
    case 'lite_frame':
      return (
        <div className="pv-lite-frame pv-object">
          <i className="pv-frame-post pv-frame-post-a" />
          <i className="pv-frame-post pv-frame-post-b" />
          <i className="pv-frame-post pv-frame-post-c" />
          <i className="pv-frame-post pv-frame-post-d" />
          <i className="pv-frame-rail pv-frame-rail-a" />
          <i className="pv-frame-rail pv-frame-rail-b" />
          <i className="pv-frame-rail pv-frame-rail-c" />
          <i className="pv-frame-shelf pv-frame-shelf-a" />
          <i className="pv-frame-shelf pv-frame-shelf-b" />
          <i className="pv-frame-node pv-frame-node-a" />
          <i className="pv-frame-node pv-frame-node-b" />
        </div>
      );
    case 'lite_power_hub':
      return (
        <div className="pv-lite-power pv-object">
          <i className="pv-lite-power-top" />
          <i className="pv-lite-power-side" />
          <i className="pv-lite-power-ring" />
          <div className="pv-lite-power-ports"><Elements count={4} className="pv-lite-power-port" /></div>
          <i className="pv-lite-power-meter" />
        </div>
      );
    default:
      return null;
  }
}

function GenericGeometry() {
  return (
    <div className="pv-generic pv-object">
      <i className="pv-generic-top" />
      <i className="pv-generic-side" />
      <i className="pv-generic-core" />
      <div className="pv-generic-lines"><Elements count={4} className="pv-generic-line" /></div>
    </div>
  );
}

export default function PartVisual({
  item,
  role,
  selected = false,
  lane = 'forge',
}) {
  const requestedRole = role || item?.category || item?.role || 'component';
  const normalizedRole = KNOWN_ROLES.has(requestedRole) ? requestedRole : 'component';
  const roleLabel = ROLE_LABELS[normalizedRole] || 'component';
  const catalogLabel = [item?.manufacturer, item?.model].filter(Boolean).join(' ');
  const accessibleLabel = catalogLabel
    ? `Illustrative proxy for the ${roleLabel} category. Catalog item: ${catalogLabel}. This is not an exact product image.`
    : `Illustrative proxy for the ${roleLabel} category. This is not an exact product image.`;
  const isLite = normalizedRole.startsWith('lite_') || lane === 'lite_grid';
  const isRack = !isLite && (
    lane === 'rackworks'
    || ['rack_enclosure', 'compute_node', 'accelerator', 'storage_shelf', 'network_switch', 'management_node', 'rack_pdu'].includes(normalizedRole)
  );

  return (
    <figure
      className={`part-visual is-${isLite ? 'lite' : isRack ? 'rack' : 'forge'}${selected ? ' is-selected' : ''}`}
      data-role={normalizedRole}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <div className="pv-stage" aria-hidden="true">
        <div className="pv-grid" />
        <div className="pv-halo" />
        <div className="pv-shadow" />
        {isLite
          ? <LiteGeometry role={normalizedRole} />
          : isRack
            ? <RackGeometry role={normalizedRole} />
            : <ForgeGeometry role={normalizedRole} />}
        {normalizedRole === 'component' && <GenericGeometry />}
        <i className="pv-scan" />
      </div>
      <figcaption>
        <span>Illustrative proxy</span>
      </figcaption>
    </figure>
  );
}
