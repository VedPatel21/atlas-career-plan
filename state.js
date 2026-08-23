(function () {
  'use strict';

  const DATA = window.ATLAS_DATA;
  const STORAGE_KEY = 'atlas-career-architecture-v2';
  const THEME_KEY = 'atlas-theme';
  const VALID_PROGRESS = new Set(Object.keys(DATA.progressLabels));
  
  const VALID_EVIDENCE_STATUS = new Set(Object.keys(DATA.statusLabels));

  function allNodes() {
    return [
      ...DATA.phases.flatMap((phase) => phase.nodes),
      ...DATA.sweDepth.nodes
    ];
  }

  const VALID_NODE_IDS = new Set(allNodes().map(n => n.id));

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  function safeParse(value, fallback = null) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function captureLegacyState() {
    const items = {};
    let taskCount = 0;
    let completedTaskCount = 0;

    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || key === STORAGE_KEY || key === THEME_KEY) continue;
        if (!key.startsWith('task-') && !key.startsWith('collapse-') && !key.startsWith('atlas-')) continue;

        const rawValue = localStorage.getItem(key);
        const parsedValue = safeParse(rawValue, rawValue);
        items[key] = parsedValue;

        if (key.startsWith('task-')) {
          taskCount += 1;
          if (parsedValue === true) completedTaskCount += 1;
        }
      }
    } catch (_) {
      return null;
    }

    if (Object.keys(items).length === 0) return null;
    return {
      source: 'ATLAS legacy checkbox roadmap',
      capturedAt: now(),
      taskCount,
      completedTaskCount,
      items,
      mappingDecision: 'Preserved verbatim. Old date/task completions were not promoted to competency proof because that mapping would be unsafe.'
    };
  }

  function createDefaultState() {
    const legacyBackup = captureLegacyState();
    const progress = {};

    allNodes().forEach((item) => {
      progress[item.id] = {
        progress: item.defaultProgress,
        evidenceStatus: item.evidenceStatus,
        note: '',
        updatedAt: now()
      };
    });

    DATA.projects.forEach((project) => {
      progress[project.id] = {
        progress: project.status,
        evidenceStatus: project.status === 'completed' ? DATA.status.PROVEN : DATA.status.MISSING,
        note: '',
        updatedAt: now()
      };
    });

    return {
      schemaVersion: DATA.stateVersion,
      roadmapVersion: DATA.roadmapVersion,
      workingNodeId: null,
      createdAt: now(),
      updatedAt: now(),
      progress,
      evidence: [],
      notes: {},
      resourceVerification: Object.fromEntries(DATA.resources.map((resource) => [resource.id, {
        lastVerified: resource.lastVerified,
        status: resource.status,
        updatedAt: null
      }])),
      careerCheckpoint: {
        lastRunAt: null,
        history: []
      },
      dismissedOptionalItems: [],
      legacyBackup,
      migration: legacyBackup ? {
        from: 'legacy-checkbox-roadmap',
        migratedAt: now(),
        completedTaskCount: legacyBackup.completedTaskCount,
        taskCount: legacyBackup.taskCount,
        result: 'Legacy state preserved in every v2 export; competency state initialized from the approved evidence audit.'
      } : null
    };
  }

  function normalizeNodeState(value, fallback) {
    const normalized = { ...fallback, ...(value || {}) };
    if (!VALID_PROGRESS.has(normalized.progress)) normalized.progress = fallback.progress;
    if (!VALID_EVIDENCE_STATUS.has(normalized.evidenceStatus)) normalized.evidenceStatus = fallback.evidenceStatus;
    normalized.note = typeof normalized.note === 'string' ? normalized.note.slice(0, 2000) : '';
    return normalized;
  }

  function migrateState(input) {
    const defaults = createDefaultState();
    if (!input || typeof input !== 'object') return defaults;

    const incoming = input.state && typeof input.state === 'object' ? input.state : input;
    const merged = {
      ...defaults,
      ...incoming,
      schemaVersion: DATA.stateVersion,
      roadmapVersion: DATA.roadmapVersion,
      workingNodeId: typeof incoming.workingNodeId === 'string' && VALID_NODE_IDS.has(incoming.workingNodeId) ? incoming.workingNodeId : null,
      progress: {},
      updatedAt: now()
    };

    Object.entries(defaults.progress).forEach(([id, fallback]) => {
      merged.progress[id] = normalizeNodeState(incoming.progress && incoming.progress[id], fallback);
    });

    merged.evidence = Array.isArray(incoming.evidence)
      ? incoming.evidence.filter((item) => item && typeof item === 'object' && typeof item.nodeId === 'string').map((item) => ({
          id: String(item.id || `evidence-${Date.now()}-${Math.random().toString(36).slice(2)}`),
          nodeId: item.nodeId,
          type: DATA.evidenceTypes.includes(item.type) ? item.type : 'Other',
          label: String(item.label || 'Imported evidence').slice(0, 100),
          url: typeof item.url === 'string' ? item.url.slice(0, 500) : '',
          notes: typeof item.notes === 'string' ? item.notes.slice(0, 800) : '',
          createdAt: item.createdAt || now()
        }))
      : [];

    merged.notes = incoming.notes && typeof incoming.notes === 'object' ? incoming.notes : {};
    merged.resourceVerification = {
      ...defaults.resourceVerification,
      ...(incoming.resourceVerification && typeof incoming.resourceVerification === 'object' ? incoming.resourceVerification : {})
    };
    merged.careerCheckpoint = incoming.careerCheckpoint && typeof incoming.careerCheckpoint === 'object'
      ? { ...defaults.careerCheckpoint, ...incoming.careerCheckpoint }
      : defaults.careerCheckpoint;
    merged.dismissedOptionalItems = Array.isArray(incoming.dismissedOptionalItems) ? incoming.dismissedOptionalItems : [];
    merged.legacyBackup = incoming.legacyBackup || defaults.legacyBackup;

    if (Number(incoming.schemaVersion || 0) < DATA.stateVersion) {
      merged.migration = {
        ...(incoming.migration || {}),
        fromSchemaVersion: Number(incoming.schemaVersion || 0),
        migratedAt: now(),
        result: 'State normalized to the current competency/evidence schema without discarding the imported payload.'
      };
    }

    return merged;
  }

  function loadState() {
    let parsed = null;
    try { parsed = safeParse(localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    const loaded = migrateState(parsed);
    saveState(loaded, false);
    return loaded;
  }

  function saveState(nextState, announce = true) {
    nextState.updatedAt = now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)); } catch (_) {}
    if (announce) window.dispatchEvent(new CustomEvent('atlas:statechange', { detail: clone(nextState) }));
  }

  let state = loadState();

  function setNodeState(id, patch, announce = true) {
    if (!state.progress[id]) return false;
    state.progress[id] = normalizeNodeState({ ...state.progress[id], ...patch, updatedAt: now() }, state.progress[id]);
    saveState(state, announce);
    return true;
  }

  function setWorkingNode(nodeId) {
    state.workingNodeId = nodeId && VALID_NODE_IDS.has(String(nodeId)) ? String(nodeId) : null;
    saveState(state);
    return state.workingNodeId;
  }

  function clearWorkingNode() {
    state.workingNodeId = null;
    saveState(state);
    return null;
  }

  function getWorkingNode() {
    return state.workingNodeId;
  }

  function addEvidence(input) {
    if (!input || !input.nodeId || !input.label) throw new Error('Capability and label are required.');
    const item = {
      id: `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nodeId: String(input.nodeId),
      type: DATA.evidenceTypes.includes(input.type) ? input.type : 'Other',
      label: String(input.label).trim().slice(0, 100),
      url: String(input.url || '').trim().slice(0, 500),
      notes: String(input.notes || '').trim().slice(0, 800),
      createdAt: now()
    };
    state.evidence.unshift(item);
    saveState(state);
    return clone(item);
  }

  function removeEvidence(id) {
    const lengthBefore = state.evidence.length;
    state.evidence = state.evidence.filter((item) => item.id !== id);
    if (state.evidence.length === lengthBefore) return false;
    saveState(state);
    return true;
  }

  function setResourceVerification(id, patch) {
    if (!state.resourceVerification[id]) return false;
    state.resourceVerification[id] = {
      ...state.resourceVerification[id],
      ...patch,
      updatedAt: now()
    };
    saveState(state);
    return true;
  }

  function recordCheckpoint(snapshot) {
    const entry = { id: `checkpoint-${Date.now()}`, createdAt: now(), snapshot };
    state.careerCheckpoint.lastRunAt = entry.createdAt;
    state.careerCheckpoint.history = [entry, ...(state.careerCheckpoint.history || [])].slice(0, 12);
    saveState(state);
    return clone(entry);
  }

  function exportPayload() {
    return {
      application: 'ATLAS Career Architecture',
      schemaVersion: DATA.stateVersion,
      roadmapVersion: DATA.roadmapVersion,
      exportedAt: now(),
      state: clone(state)
    };
  }

  function importPayload(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('The selected file is not a valid ATLAS backup.');
    const candidate = payload.state || payload;
    if (!candidate.progress && !candidate.evidence && !candidate.legacyBackup) {
      throw new Error('This JSON file does not contain recognizable ATLAS state.');
    }
    state = migrateState(candidate);
    state.migration = {
      ...(state.migration || {}),
      importedAt: now(),
      sourceRoadmapVersion: payload.roadmapVersion || candidate.roadmapVersion || 'unknown',
      result: 'Imported data normalized to the current schema; legacy payload retained when present.'
    };
    saveState(state);
    return clone(state);
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    state = createDefaultState();
    saveState(state);
    return clone(state);
  }

  function getTheme() {
    try {
      const parsed = safeParse(localStorage.getItem(THEME_KEY), localStorage.getItem(THEME_KEY));
      return parsed === 'light' ? 'light' : 'dark';
    } catch (_) { return 'dark'; }
  }

  function setTheme(theme) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, JSON.stringify(normalized)); } catch (_) {}
    return normalized;
  }

  window.ATLAS_STORE = {
    storageKey: STORAGE_KEY,
    getState: () => clone(state),
    setNodeState,
    setWorkingNode,
    clearWorkingNode,
    getWorkingNode,
    addEvidence,
    removeEvidence,
    setResourceVerification,
    recordCheckpoint,
    exportPayload,
    importPayload,
    reset,
    getTheme,
    setTheme,
    migrateState,
    createDefaultState
  };
})();
