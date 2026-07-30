import { useId, useMemo, useState } from 'react';
import {
  Box,
  Boxes,
  CircleAlert,
  Focus,
  Rotate3d,
  Scan,
  Sparkles,
} from 'lucide-react';
import './BuildStage.css';

const ROLE_LABELS = {
  cpu: 'Processor',
  motherboard: 'Motherboard',
  memory: 'Memory',
  gpu: 'Graphics',
  storage: 'Storage',
  case: 'Case',
  cooler: 'Cooling',
  psu: 'Power supply',
  rack_enclosure: 'Rack enclosure',
  compute_node: 'Compute node',
  accelerator: 'Accelerator',
  storage_shelf: 'Storage shelf',
  network_switch: 'Network fabric',
  management_node: 'Management',
  rack_pdu: 'Rack power',
  lite_node: 'Lite node',
  lite_switch: 'Lite fabric',
  lite_frame: 'Grid frame',
  lite_power_hub: 'Power hub',
};

const LANE_META = {
  forge: {
    label: 'Forge assembly',
    description: 'A spatial planning view of the current PC parts tray.',
    defaultRoles: ['case', 'motherboard', 'cpu', 'memory', 'gpu', 'storage', 'cooler', 'psu'],
  },
  rackworks: {
    label: 'Rackworks elevation',
    description: 'A spatial planning view of the current rack systems tray.',
    defaultRoles: ['rack_enclosure', 'rack_pdu', 'compute_node', 'accelerator', 'storage_shelf', 'network_switch', 'management_node'],
  },
  lite_grid: {
    label: 'Lite Grid topology',
    description: 'A spatial planning view of the current compact grid tray.',
    defaultRoles: ['lite_frame', 'lite_power_hub', 'lite_node', 'lite_switch'],
  },
};

const safeLane = (lane) => Object.hasOwn(LANE_META, lane) ? lane : 'forge';

function selectedName(item, fallback) {
  if (!item) return `${fallback} unresolved`;
  const label = [item.manufacturer, item.model].filter(Boolean).join(' ').trim();
  return label || item.name || fallback;
}

/**
 * Deterministic, CSS-only spatial preview for a configurator parts tray.
 * Geometry is intentionally illustrative and never participates in validation.
 */
export default function BuildStage({
  lane = 'forge',
  selected = {},
  selectedRole,
  roles,
  issues = [],
}) {
  const stageId = useId();
  const normalizedLane = safeLane(lane);
  const meta = LANE_META[normalizedLane];
  const [exploded, setExploded] = useState(false);
  const [orbiting, setOrbiting] = useState(true);
  const [isolated, setIsolated] = useState(false);

  const stageRoles = useMemo(() => {
    const source = Array.isArray(roles) && roles.length ? roles : meta.defaultRoles;
    return [...new Set(source.filter((role) => typeof role === 'string' && role.length))];
  }, [meta.defaultRoles, roles]);

  const focusRole = stageRoles.includes(selectedRole) ? selectedRole : stageRoles[0];
  const completedRoles = stageRoles.filter((role) => Boolean(selected?.[role]));
  const progress = stageRoles.length
    ? Math.round((completedRoles.length / stageRoles.length) * 100)
    : 0;
  const focusedItem = focusRole ? selected?.[focusRole] : null;
  const issueCount = Array.isArray(issues) ? issues.length : 0;
  const assemblyLabel = exploded ? 'Exploded' : 'Assembled';

  return (
    <section
      className={`build-stage is-${normalizedLane}`}
      aria-labelledby={`${stageId}-title`}
      data-has-issues={issueCount > 0 ? 'true' : 'false'}
    >
      <header className="build-stage__header">
        <div>
          <span className="build-stage__eyebrow"><Sparkles aria-hidden="true" /> Live build stage</span>
          <h2 id={`${stageId}-title`}>{meta.label}</h2>
          <p>{meta.description}</p>
        </div>
        <div className="build-stage__truth">
          <Scan aria-hidden="true" />
          <span>Illustrative proxy · non-authoritative</span>
        </div>
      </header>

      <div className="build-stage__viewport">
        <div className="build-stage__telemetry" aria-hidden="true">
          <span>{normalizedLane.replaceAll('_', ' ')}</span>
          <i />
          <span>{assemblyLabel}</span>
        </div>

        <div
          className="build-stage__scene"
          data-exploded={exploded ? 'true' : 'false'}
          data-orbiting={orbiting ? 'true' : 'false'}
          data-isolated={isolated ? 'true' : 'false'}
          aria-hidden="true"
        >
          <div className="build-stage__floor">
            <span />
          </div>
          <div className="build-stage__orbit">
            <div className="build-stage__rig">
              <div className="build-stage__shell">
                <span className="build-stage__shell-edge" />
              </div>
              {stageRoles.map((role, index) => {
                const present = Boolean(selected?.[role]);
                const focused = role === focusRole;
                const roleClass = role.replaceAll('_', '-');
                return (
                  <div
                    className={`build-stage__part role-${roleClass}`}
                    data-present={present ? 'true' : 'false'}
                    data-focused={focused ? 'true' : 'false'}
                    style={{ '--build-order': index }}
                    key={role}
                  >
                    <span className="build-stage__geometry">
                      <i className="build-stage__geometry-detail" />
                    </span>
                    <span className="build-stage__part-label">{ROLE_LABELS[role] || role.replaceAll('_', ' ')}</span>
                  </div>
                );
              })}
              <div className="build-stage__core">
                <span />
              </div>
            </div>
          </div>
        </div>

        <div className="build-stage__reticle" aria-hidden="true"><i /><i /><i /><i /></div>

        <div className="build-stage__readout" aria-live="polite">
          <span>{ROLE_LABELS[focusRole] || focusRole?.replaceAll('_', ' ') || 'Assembly'}</span>
          <strong>{selectedName(focusedItem, 'Component')}</strong>
          <small>{isolated ? 'Isolated inspection' : `${assemblyLabel} inspection`}</small>
        </div>

        <div className="build-stage__issue" data-active={issueCount > 0 ? 'true' : 'false'}>
          {issueCount > 0 ? <CircleAlert aria-hidden="true" /> : <Box aria-hidden="true" />}
          <span>{issueCount > 0 ? `${issueCount} preview issue${issueCount === 1 ? '' : 's'}` : 'Preview geometry only'}</span>
        </div>
      </div>

      <div className="build-stage__controls" aria-label="Build stage controls">
        <button
          type="button"
          aria-pressed={exploded}
          onClick={() => setExploded((current) => !current)}
        >
          <Boxes aria-hidden="true" />
          <span>{exploded ? 'Assemble view' : 'Explode view'}</span>
        </button>
        <button
          type="button"
          aria-pressed={orbiting}
          onClick={() => setOrbiting((current) => !current)}
        >
          <Rotate3d aria-hidden="true" />
          <span>{orbiting ? 'Pause orbit' : 'Start orbit'}</span>
        </button>
        <button
          type="button"
          aria-pressed={isolated}
          disabled={!focusRole}
          onClick={() => setIsolated((current) => !current)}
        >
          <Focus aria-hidden="true" />
          <span>{isolated ? 'Show assembly' : `Isolate ${ROLE_LABELS[focusRole] || 'role'}`}</span>
        </button>
      </div>

      <footer className="build-stage__progress">
        <div>
          <span>Assembly progress</span>
          <strong>{completedRoles.length} of {stageRoles.length} roles</strong>
        </div>
        <div
          className="build-stage__progress-track"
          role="progressbar"
          aria-label="Assembly progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <span style={{ '--build-progress': `${progress}%` }} />
        </div>
        <output>{progress}%</output>
      </footer>
    </section>
  );
}
