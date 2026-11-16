'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const curriculumContract = require('./curriculum-contract');
const curriculumBaseline = require('./curriculum-baseline.json');

const dataContext = { window: {} };
vm.createContext(dataContext);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), dataContext, { filename: 'data.js' });
const data = dataContext.window.ATLAS_DATA;

const currentContract = curriculumContract(data);
for (const [section, hash] of Object.entries(curriculumBaseline)) {
  assert.equal(currentContract[section], hash, `Curriculum changed in ${section}`);
}

assert.equal(data.roadmapVersion, '2.4.0');
assert.equal(data.phases.length, 9, 'all nine dependency stages must exist');
assert.deepEqual(Array.from(data.phases.map((item) => item.id)), ['swe-core','math-data','classical-ml','ml-engineering','deep-learning','llm-fundamentals','ai-systems','production-ai','specialization'], 'Career phase identities must remain unchanged');
assert.equal(data.resources.length, 33, 'approved R1–R31 registry plus targeted R32–R33 additions must exist');
assert.equal(data.currentPosition.evidenceAudit.length, 12, 'current-position evidence audit must remain explicit');
assert.deepEqual(Array.from(data.resources.map((item) => item.id)), Array.from({ length: 33 }, (_, index) => `R${index + 1}`), 'existing approved resources and R32–R33 must remain in one registry');

// YouTube Learning Registry Checks
assert.ok(Array.isArray(data.youtubeLearning), 'youtubeLearning registry must exist');
assert.ok(data.youtubeLearning.length >= 10, 'must contain verified YouTube courses');
data.youtubeLearning.forEach((course) => {
  assert.ok(course.id && course.title && course.creator && course.url && course.type && course.duration && course.whySelected && course.selectedSections && course.doneWhen);
  if (course.status === 'VERIFIED') {
    assert.match(course.url, /^https:\/\/(www\.)?(youtube\.com|missing\.csail\.mit\.edu)/);
  }
});

// AI-Native Engineering Checks
assert.ok(data.aiNativeEngineering && data.aiNativeEngineering.title && data.aiNativeEngineering.workingMethod, 'aiNativeEngineering guidance must exist');
assert.ok(data.aiNativeEngineering.aiIndependentFloor.length >= 4, 'must declare AI-independent floor competencies');

// Task Recipe, Hands-On Labs, Completion Checks
const allNodes = [...data.phases.flatMap((phase) => phase.nodes), ...data.sweDepth.nodes];
allNodes.forEach((item) => {
  assert.ok(item.whatIsThis, `${item.id} must explain the capability in simple words`);
  assert.ok(item.why, `${item.id} must explain why the capability matters`);
  assert.ok(item.teaches.length, `${item.id} must explain what the capability teaches`);
  assert.ok(item.completionCheck, `${item.id} must provide a self-assessment completion check`);
  assert.ok(item.explainIt, `${item.id} must provide an explain-it articulation prompt`);
  ['whyNow','careerConnection','unlocks'].forEach((field) => assert.ok(item[field], `${item.id} must include task-recipe field ${field}`));
});

// Verify Hands-On Labs on Core and Depth nodes
const actionableNodeIds = ['testing','docker','basic-ci','dsa','http-api','relational-db','backend','linear-algebra','probability-statistics','calculus-optimization','numpy','pandas-eda','data-quality','ml-problem-framing','ml-data-splits','ml-models','ml-evaluation','ml-reproducibility','experiment-tracking','ml-pipelines','model-serving','ml-deployment','ml-monitoring','dl-mechanics','pytorch','dl-debugging','embeddings-attention','local-llm','transformers','llm-inference','retrieval-rag','agents','mcp','context-engineering','llm-evals','ai-observability','ai-reliability','ai-security','ai-economics','feedback-loops','production-deployment','system-design','cloud-fundamentals','backend-db-depth','observability-reliability','software-security','performance-concurrency','operational-maturity'];
actionableNodeIds.forEach((id) => {
  const node = allNodes.find((n) => n.id === id);
  assert.ok(node, `node ${id} must exist`);
  assert.ok(node.handsOnLab, `${id} must contain a structured handsOnLab`);
  assert.ok(node.handsOnLab.title && node.handsOnLab.goal && node.handsOnLab.steps.length >= 3 && node.handsOnLab.expectedResult, `${id} handsOnLab must have title, goal, steps, and expectedResult`);
});

// Projects checks
const p1 = data.projects.find((p) => p.id === 'project-1');
const p2 = data.projects.find((p) => p.id === 'project-2');
const p3 = data.projects.find((p) => p.id === 'project-3');
const p4 = data.projects.find((p) => p.id === 'project-4');
const p5 = data.projects.find((p) => p.id === 'project-5');

assert.ok(p1 && p2 && p3 && p4 && p5, 'all 5 projects must exist');
assert.match(p1.direction, /Pawnstone Vault.*subject to architecture fit/i);
assert.match(p1.optionalGreenfield, /ReSource Relay/i);
assert.match(p2.domainBadge, /CivicPulse/i);
assert.match(p3.domainBadge, /Project 2/i);
assert.match(p4.domainBadge, /RoadSight.*PyTorch/i);
assert.match(p4.mustProve.join(' '), /training or fine-tuning in PyTorch/i);
assert.match(p5.domainBadge, /RepoScope/i);

// Opportunities checks
const mitacs = data.opportunities.find((o) => o.id === 'mitacs-2027');
const mlh = data.opportunities.find((o) => o.id === 'mlh');
const gsoc = data.opportunities.find((o) => o.id === 'gsoc');
const lfx = data.opportunities.find((o) => o.id === 'lfx');

assert.ok(mitacs && mlh && gsoc && lfx, 'all 4 opportunity entries (Mitacs, MLH, GSoC, LFX) must exist');
assert.match(mitacs.deadline, /September 16, 2026|16 Sep 2026/i);
assert.match(mitacs.eligibilityWarning, /AICTE.*Mitacs/i);
assert.match(gsoc.date, /NOT YET PUBLISHED/i);
assert.match(gsoc.eligibilityWarning, /AI POLICY.*WARNING/i);
assert.ok(data.internshipChecklist && data.internshipChecklist.criteria.length >= 3, 'internship quality checklist must exist');

// Roles Dynamic Requirements
data.roles.forEach((role) => {
  assert.ok(Array.isArray(role.requiredNodeIds), `${role.id} must define requiredNodeIds`);
  assert.ok(Array.isArray(role.requiredProjects), `${role.id} must define requiredProjects`);
  assert.ok(role.interviewExpectations, `${role.id} must define interviewExpectations`);
});

// Glossary
const glossaryTerms = data.glossary.map((item) => item.term);
['CI','CI/CD','Deployment','Container','SRE','Observability','Logs','Metrics','Tracing','MLOps','Inference','Embedding','RAG','Reranking','IAM','Latency','Throughput','P99 Latency','CAP Theorem','Idempotency','MCP','Agent','Vector Database','Regression Evaluation'].forEach((term) => {
  assert.ok(glossaryTerms.includes(term), `glossary must explain ${term}`);
});

// Education & Canada
assert.ok(data.education && data.education.planningHorizon && data.education.policySnapshot && data.education.universitySnapshot, 'structured Education & Canada data must exist');
assert.equal(data.education.universitySnapshot.programs.length, 5);

// DOM & UI checks
['home','map','learn','projects','readiness','resources','education','settingsPanel'].forEach((id) => {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing section ${id}`);
});
assert.match(html, /id="workingTaskContainer"/);
assert.match(html, /id="aiNativeBanner"/);
assert.match(html, /id="youtubeCourseGrid"/);
assert.match(html, /id="internshipChecklistContainer"/);
assert.equal((html.match(/class="nav-link"/g) || []).length, 6, 'learning workspace must stay within the existing navigation');
assert.match(html, /id="continueLearning"/);
assert.match(html, /id="glossaryGrid"/);
assert.match(css, /\.workspace-section/);
assert.match(css, /\.youtube-course-card/);
assert.doesNotMatch(css, /\.node-card\[open\]/);
assert.match(css, /\.lab-card/);

// State management checks
class LocalStorageMock {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  get length() { return this.map.size; }
  key(index) { return Array.from(this.map.keys())[index] ?? null; }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const legacyStorage = new LocalStorageMock({
  'task-p0-w1-1': 'true',
  'task-p0-w1-2': 'false',
  'collapse-p0-week1': 'true',
  'atlas-theme': '"dark"'
});
const stateContext = {
  window: { ATLAS_DATA: data, dispatchEvent() {}, CustomEvent: class {} },
  localStorage: legacyStorage,
  CustomEvent: class {},
  Date,
  Math,
  JSON,
  Set,
  Object,
  Array,
  String,
  Number
};
vm.createContext(stateContext);
vm.runInContext(fs.readFileSync(path.join(root, 'state.js'), 'utf8'), stateContext, { filename: 'state.js' });
const store = stateContext.window.ATLAS_STORE;
const initial = store.getState();

assert.equal(initial.schemaVersion, 2);
assert.equal(initial.roadmapVersion, '2.4.0');
assert.equal(initial.workingNodeId, null);
assert.equal(initial.legacyBackup.taskCount, 2);
assert.equal(initial.legacyBackup.completedTaskCount, 1);

// Working task pinning
store.setWorkingNode('testing');
assert.equal(store.getState().workingNodeId, 'testing');
assert.equal(store.getWorkingNode(), 'testing');
store.clearWorkingNode();
assert.equal(store.getState().workingNodeId, null);

// Projects cannot be pinned
store.setWorkingNode('project-1');
assert.equal(store.getState().workingNodeId, null, 'Projects should not be pinnable');

// Node state updates
store.setNodeState('testing', { progress: 'completed' });
assert.equal(store.getState().progress.testing.progress, 'completed');

const exported = store.exportPayload();
assert.equal(exported.roadmapVersion, '2.4.0');
const imported = store.importPayload({ roadmapVersion:'2.3.0', state:{ schemaVersion:2, workingNodeId:'docker', progress:{ docker:{progress:'in-progress',evidenceStatus:'already-proven'} } } });
assert.equal(imported.workingNodeId, 'docker');
assert.equal(imported.progress.docker.progress, 'in-progress');

// Exercise the real overview model with the current curriculum and store.
const appWindow = {
  ATLAS_DATA: data,
  ATLAS_STORE: store,
  matchMedia: () => ({ matches: false })
};
const documentBeforeLoad = { readyState: 'loading', addEventListener() {} };
vm.runInNewContext(appSource, { window: appWindow, document: documentBeforeLoad }, { filename: 'app.js' });
const overview = appWindow.ATLAS.getOverviewModel;
const freshModel = overview(initial);
assert.equal(freshModel.mission.id, 'testing');
assert.deepEqual(Array.from(freshModel.nextTasks.slice(0, 2), (item) => item.id), ['docker', 'basic-ci']);

const pinnedDepth = overview({ ...initial, workingNodeId: 'system-design' });
assert.equal(pinnedDepth.mission.id, 'system-design');
assert.equal(pinnedDepth.missionPhase, data.sweDepth);
assert.equal(pinnedDepth.nextTasks[0].id, 'testing');

const pinnedNext = overview({ ...initial, workingNodeId: 'docker' });
assert.equal(pinnedNext.mission.id, 'docker');
assert.equal(pinnedNext.nextTasks[0].id, 'testing');
assert.ok(pinnedNext.nextTasks.every((item) => item.id !== 'docker'));

const resumed = overview({
  ...initial,
  progress: {
    ...initial.progress,
    testing: { ...initial.progress.testing, progress: 'completed' },
    docker: { ...initial.progress.docker, progress: 'skipped' }
  }
});
assert.equal(resumed.mission.id, 'basic-ci');

const allComplete = {
  ...initial,
  progress: Object.fromEntries(allNodes.map((item) => [
    item.id, { ...initial.progress[item.id], progress: 'completed' }
  ]))
};
assert.equal(overview(allComplete).mission, null);
assert.equal(overview(allComplete).nextTasks.length, 0);
assert.equal(overview({ ...allComplete, workingNodeId: 'testing' }).mission.id, 'testing');

// A portable current backup must keep both the current learning state and the original legacy payload.
store.setWorkingNode('docker');
store.setNodeState('docker', { note: 'Use a reproducible container build' });
store.setResourceVerification('R4', { status: 'needs-review', lastVerified: '12 Nov 2026' });
store.recordCheckpoint({ missionId: 'docker' });
const saved = store.exportPayload();
const roundTrip = store.importPayload(saved);
assert.equal(roundTrip.workingNodeId, 'docker');
assert.equal(roundTrip.progress.docker.note, 'Use a reproducible container build');
assert.equal(roundTrip.resourceVerification.R4.status, 'needs-review');
assert.equal(roundTrip.careerCheckpoint.history[0].snapshot.missionId, 'docker');
assert.equal(roundTrip.legacyBackup.items['task-p0-w1-1'], true);
assert.equal(roundTrip.progress['pandas-eda'].progress, 'completed');

const olderBackup = store.importPayload(require('./import-fixture.json'));
assert.equal(olderBackup.schemaVersion, 2);
assert.equal(olderBackup.progress.docker.note, 'Imported browser QA fixture');
assert.equal(olderBackup.progress.testing.progress, 'not-started');
assert.equal(olderBackup.legacyBackup.taskCount, 2);

// Micro-correction regression tests
const yt4 = data.youtubeLearning.find(yt => yt.id === 'YT4');
assert.ok(yt4, 'YT4 must exist');
assert.strictEqual(yt4.url, 'https://www.youtube.com/watch?v=xwI5OBEnsZU', 'YT4 DSA URL must be correct');

const mitacsObj = data.opportunities.find(o => o.id === 'mitacs-2027');
assert.ok(mitacsObj, 'mitacs-2027 must exist');
assert.strictEqual(mitacsObj.status, 'CURRENTLY NOT ELIGIBLE — INSTITUTION NOT ON 2027 INDIA ELIGIBILITY LIST', 'Mitacs must have correct not eligible status');

allNodes.forEach(node => {
  assert.ok(node.completionCheck && node.completionCheck.trim() !== '', `Node ${node.id} must have a specific completionCheck`);
  assert.notStrictEqual(node.completionCheck, 'Completion check has not been configured for this capability.', `Node ${node.id} cannot use the generic completion check fallback`);
});

console.log('ATLAS smoke tests passed, including curriculum identity, learning recommendations, and state compatibility.');
