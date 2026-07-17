const LOCAL_PREFIX = 'hyperion-intake-v1';
const LOCAL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

const localKey = (lane) => `${LOCAL_PREFIX}:${lane}`;

export function createIntakeProgressRecord({ lane, effects, step, revision, supersedes, ids }, now = Date.now()) {
  return {
    lane,
    effects,
    step,
    revision,
    supersedes,
    ids: {
      intake: ids.intake,
      session: ids.session,
      draft: ids.draft,
      trace: ids.trace,
      idempotency: ids.idempotency,
    },
    draft_id: ids.draft,
    saved_at: now,
    expires_at: now + LOCAL_RETENTION_MS,
  };
}

function sanitizeIntakeProgressRecord(value) {
  return {
    lane: value.lane,
    effects: value.effects,
    step: value.step,
    revision: value.revision,
    supersedes: value.supersedes,
    ids: {
      intake: value.ids?.intake,
      session: value.ids?.session,
      draft: value.ids?.draft,
      trace: value.ids?.trace,
      idempotency: value.ids?.idempotency,
    },
    draft_id: value.draft_id || value.ids?.draft,
    saved_at: value.saved_at,
    expires_at: value.expires_at,
  };
}

export function readIntakeProgress(lane) {
  try {
    const value = JSON.parse(localStorage.getItem(localKey(lane)) || 'null');
    if (!value || value.expires_at <= Date.now()) {
      localStorage.removeItem(localKey(lane));
      return null;
    }
    const sanitized = sanitizeIntakeProgressRecord(value);
    localStorage.setItem(localKey(lane), JSON.stringify(sanitized));
    return sanitized;
  } catch {
    return null;
  }
}

export function writeIntakeProgress(lane, progress) {
  try {
    localStorage.setItem(localKey(lane), JSON.stringify(progress));
  } catch {
    // Browser storage can be disabled.
  }
}

export function clearIntakeProgress(lane) {
  try {
    localStorage.removeItem(localKey(lane));
  } catch {
    // Browser storage can be disabled.
  }
}
