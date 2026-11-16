(function () {
  'use strict';

  const DATA = window.ATLAS_DATA;
  const STORE = window.ATLAS_STORE;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const debounce = (fn, wait = 120) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  };

  const statusClass = (status) => {
    const map = {
      'already-proven': 'status-proven',
      'likely-proven': 'status-likely',
      partial: 'status-partial',
      missing: 'status-missing',
      'not-needed-yet': 'status-not-needed',
      locked: 'status-locked',
      optional: 'status-optional'
    };
    return map[status] || 'status-not-needed';
  };

  const progressClass = (progress) => `progress-${progress}`;
  const externalLink = (url, label = 'Open resource') => `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`;
  const listHTML = (items) => items && items.length ? `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : '<p>—</p>';

  const tracks = [...DATA.phases, DATA.sweDepth];
  const capabilityNodes = tracks.flatMap((track) => track.nodes);
  const nodeLookup = new Map(capabilityNodes.map((node) => [node.id, node]));
  const nodeTrack = new Map(tracks.flatMap((track) => track.nodes.map((node) => [node.id, track])));
  const projectLookup = new Map(DATA.projects.map((project) => [project.id, project]));
  const roles = new Map(DATA.roles.map((role) => [role.id, role]));
  const opportunities = new Map(DATA.opportunities.map((item) => [item.id, item]));
  const resources = new Map(DATA.resources.map((item) => [item.id, item]));
  const courses = new Map(DATA.youtubeLearning.map((item) => [item.id, item]));
  const glossary = new Map(DATA.glossary.map((item) => [item.term, item]));
  const educationSections = new Map(DATA.education.sectionNav);
  const resourceStatuses = ['current', 'still-good', 'needs-review', 'unavailable', 'locked'];

  const VIEW_TITLES = {
    home: 'Overview',
    map: 'Career Map',
    learn: 'Learning',
    projects: 'Projects',
    readiness: 'Careers',
    resources: 'Resource Library',
    education: 'Education & Canada'
  };
  const routeTargets = {
    '#experience': { view: 'readiness', heading: 'experienceTitle' },
    '#opportunities': { view: 'readiness', heading: 'opportunitiesTitle' },
    '#proof': { view: 'map', heading: 'proofTitle' },
    '#trajectory': { view: 'map', heading: 'trajectoryTitle' },
    '#glossary': { view: 'resources', heading: 'glossaryTitle' },
    '#resources/references': { view: 'resources', heading: 'referencesTitle' },
    '#resources/courses': { view: 'resources', heading: 'coursesTitle' },
    '#checkpoint': { view: 'checkpoint' },
    '#settings': { view: 'checkpoint' }
  };
  const learningSections = new Set(['learn', 'practice', 'understanding']);

  let activeRoute;
  let activeHash;
  let activeEducationSection = 'overview';
  let mapVisit;
  let renderedTask;
  let previousState;
  let settingsReturnFocus;

  const taskLink = (id, section) => `#learn/${encodeURIComponent(id)}${section ? `/${section}` : ''}`;

  function getState() { return STORE.getState(); }

  function toast(message) {
    const region = $('#settingsPanel').open ? $('#settingsToastRegion') : $('#toastRegion');
    const item = document.createElement('div');
    item.className = 'toast';
    item.textContent = message;
    region.append(item);
    setTimeout(() => item.remove(), 3600);
  }

  function renderStatusBadge(status) {
    return `<span class="status-badge ${statusClass(status)}">${escapeHTML(DATA.statusLabels[status] || status)}</span>`;
  }

  function renderProgressBadge(progress, attr = '') {
    return `<span class="status-badge ${progressClass(progress)}" ${attr}>${escapeHTML(DATA.progressLabels[progress])}</span>`;
  }

  function updateBadge(badge, label, className) {
    if (!badge) return;
    badge.className = `status-badge ${className}`;
    if (badge.textContent !== label) badge.textContent = label;
  }

  function updateProgressBadge(badge, progress) {
    updateBadge(badge, DATA.progressLabels[progress], progressClass(progress));
  }

  function resourceTypeClass(type) {
    if (/locked/i.test(type)) return 'resource-type-locked';
    if (/later/i.test(type)) return 'resource-type-later';
    if (/diagnostic|gap filler/i.test(type)) return 'resource-type-diagnostic';
    if (/practice/i.test(type)) return 'resource-type-practice';
    if (/reference/i.test(type)) return 'resource-type-reference';
    if (/selected/i.test(type)) return 'resource-type-selected';
    return 'resource-type-primary';
  }

  function renderResourceTypeBadge(resource) {
    return `<span class="resource-type-badge ${resourceTypeClass(resource.type)}">${escapeHTML(resource.type)}</span>`;
  }

  function baselineCapabilityCoverage() {
    const usable = capabilityNodes.filter((item) => ![DATA.status.OPTIONAL, DATA.status.NOT_NEEDED, DATA.status.LOCKED].includes(item.evidenceStatus));
    const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);
    const achieved = usable.reduce((sum, item) => {
      const progress = item.defaultProgress;
      const multiplier = progress === 'completed' ? 1 : progress === 'in-progress' ? 0.4 : 0;
      return sum + item.weight * multiplier;
    }, 0);
    return totalWeight ? Math.round((achieved / totalWeight) * 100) : 0;
  }

  function actionCompletionCount(state) {
    const completedCapabilities = capabilityNodes.filter((item) => item.defaultProgress !== 'completed' && state.progress[item.id]?.progress === 'completed').length;
    const completedProjects = DATA.projects.filter((item) => item.status !== 'completed' && state.progress[item.id]?.progress === 'completed').length;
    return completedCapabilities + completedProjects;
  }

  function nodeState(item, state) {
    return state.progress[item.id] || { progress: item.defaultProgress, evidenceStatus: item.evidenceStatus, note: '' };
  }

  function isSuggested(item, state) {
    const { progress, evidenceStatus } = nodeState(item, state);
    return !['completed', 'skipped'].includes(progress)
      && ![DATA.status.OPTIONAL, DATA.status.NOT_NEEDED, DATA.status.LOCKED].includes(evidenceStatus);
  }

  function getOverviewModel(state = getState()) {
    const currentPhase = DATA.phases.find((phase) => phase.name === DATA.currentPosition.stage) || DATA.phases[0];
    const workingNode = nodeLookup.get(state.workingNodeId) || null;
    const queue = tracks.flatMap((track) => {
      const candidates = track.nodes.filter((item) => isSuggested(item, state));
      return [
        ...candidates.filter((item) => nodeState(item, state).evidenceStatus === DATA.status.MISSING),
        ...candidates.filter((item) => nodeState(item, state).evidenceStatus !== DATA.status.MISSING)
      ];
    });
    const recommended = queue[0] || null;
    const mission = workingNode || recommended;

    return {
      currentPhase,
      recommendedPhase: recommended ? nodeTrack.get(recommended.id) : null,
      missionPhase: mission ? nodeTrack.get(mission.id) : null,
      mission,
      workingNode,
      recommended,
      nextTasks: queue.filter((item) => item.id !== mission?.id).slice(0, 3),
      verifyOnce: currentPhase.nodes.filter((item) => item.id !== mission?.id && isSuggested(item, state)
        && [DATA.status.LIKELY, DATA.status.PARTIAL].includes(nodeState(item, state).evidenceStatus)).slice(0, 3),
      coreSequence: ['testing', 'docker', 'basic-ci'].map((id) => nodeLookup.get(id)),
      role: DATA.roles.find((role) => role.state === 'apply-now') || DATA.roles[0],
      project: DATA.projects[0]
    };
  }

  function nextLearningTask(item, state, overview) {
    if (overview.mission?.id === item.id) return overview.nextTasks[0];
    const track = nodeTrack.get(item.id);
    const position = track.nodes.indexOf(item);
    if (track === overview.recommendedPhase) return overview.recommended;
    return track.nodes.slice(position + 1).find((candidate) => isSuggested(candidate, state)) || overview.recommended;
  }

  function decodeRouteId(value) {
    try { return decodeURIComponent(value); } catch (_) { return ''; }
  }

  function parseRoute(hash) {
    if (Object.hasOwn(routeTargets, hash)) return routeTargets[hash];
    const [view, first, second, ...extra] = hash.slice(1).split('/');
    const id = decodeRouteId(first || '');
    if (!first && second === undefined && Object.hasOwn(VIEW_TITLES, view) && view !== 'learn') return { view };
    if (!extra.length) {
      if (view === 'learn' && nodeLookup.has(id) && (second === undefined || learningSections.has(second))) {
        return { view, id, section: second };
      }
      if (view === 'projects' && projectLookup.has(id) && second === undefined) return { view, id };
      if (view === 'readiness' && first === 'role' && roles.has(decodeRouteId(second || ''))) {
        return { view, id: decodeRouteId(second), type: 'role' };
      }
      if (view === 'readiness' && first === 'opportunity' && opportunities.has(decodeRouteId(second || ''))) {
        return { view, id: decodeRouteId(second), type: 'opportunity' };
      }
      if (view === 'resources' && first === 'course' && courses.has(decodeRouteId(second || ''))) {
        return { view, id: decodeRouteId(second), type: 'course' };
      }
      if (view === 'resources' && first === 'glossary' && glossary.has(decodeRouteId(second || ''))) {
        return { view, id: decodeRouteId(second), type: 'glossary' };
      }
      if (view === 'resources' && resources.has(id) && second === undefined) return { view, id };
      if (view === 'education' && educationSections.has(id) && second === undefined) return { view, id };
    }
    if (hash.startsWith('#resource-') && resources.has(hash.slice(10))) return { view: 'resources', id: hash.slice(10) };
    const educationAnchor = hash.match(/^#education-(tab|panel)-(.+)$/);
    if (educationAnchor && educationSections.has(educationAnchor[2])) return { view: 'education', id: educationAnchor[2] };
    if (view === 'learn') return { view: 'learn', unavailable: true };
    if (Object.hasOwn(VIEW_TITLES, view)) return { view };
    return { view: 'home' };
  }

  function selectByData(attribute, value, scope = document) {
    return scope.querySelector(`[${attribute}="${CSS.escape(value)}"]`);
  }

  function revealTarget(target) {
    if (!target) return false;
    let disclosure = target.closest('details');
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement.closest('details');
    }
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.focus({ preventScroll: true });
    return true;
  }

  function revealRouteTarget(route) {
    if (route.heading) return revealTarget(document.getElementById(route.heading));
    if (route.view === 'learn' && route.section) return revealTarget($(`#workspace-${route.section} h2`));
    if (!route.id || route.view === 'learn') return false;
    if (route.view === 'education') {
      showEducationPanel(route.id);
      return revealTarget(selectByData('data-education-panel', route.id));
    }
    if (route.view === 'projects') return revealTarget(selectByData('data-project-id', route.id)?.querySelector('summary'));
    if (route.type === 'role') return revealTarget(selectByData('data-role-id', route.id)?.querySelector('summary'));
    if (route.type === 'opportunity') return revealTarget(selectByData('data-opportunity-id', route.id)?.querySelector('h3'));
    if (route.type === 'course') return revealTarget(selectByData('data-yt-id', route.id)?.querySelector('h3'));
    if (route.type === 'glossary') return revealTarget(selectByData('data-glossary-term', route.id)?.querySelector('h3'));
    if (route.view === 'resources') return revealResource(route.id);
    return false;
  }

  function restoreMapVisit() {
    window.scrollTo({ top: mapVisit.scroll, behavior: 'instant' });
    const row = mapVisit.nodeId && selectByData('data-node-id', mapVisit.nodeId);
    const link = row && !row.hidden && row.closest('details')?.open ? row.querySelector('a') : null;
    (link || row?.closest('details')?.querySelector('summary') || $('#mapTitle')).focus({ preventScroll: true });
  }

  function applyRoute(hash, { initial = false, source } = {}) {
    const route = parseRoute(hash);
    closeSearchPanel();
    if (route.view === 'checkpoint') {
      if (!activeRoute) applyRoute('#home', { initial });
      const invoker = source || document.activeElement;
      closeSidebar();
      openSettingsPanel(invoker);
      return;
    }

    if ($('#settingsPanel').open) $('#settingsPanel').close();
    closeSidebar();
    const previousRoute = activeRoute;
    if (previousRoute?.view === 'map' && route.view !== 'map') {
      const row = source?.closest('[data-node-id]') || document.activeElement.closest('[data-node-id]');
      mapVisit = { scroll: window.scrollY, nodeId: row?.dataset.nodeId };
    }
    activeRoute = route;
    activeHash = hash || '#home';
    $$('.view-section').forEach((section) => {
      section.hidden = section.id !== route.view;
    });
    $$('.nav-link').forEach((link) => {
      const current = link.dataset.section === (route.view === 'learn' ? 'map' : route.view);
      if (current) link.setAttribute('aria-current', route.view === 'learn' ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
    $('#currentViewLabel').textContent = VIEW_TITLES[route.view];

    if (route.view === 'learn' && renderedTask !== (route.id || null)) {
      renderWorkspace(route.id, getState());
    }
    const pageTitle = route.view === 'learn' && route.id ? nodeLookup.get(route.id).name : VIEW_TITLES[route.view];
    document.title = `${pageTitle} · ATLAS`;
    if (revealRouteTarget(route)) return;
    if (route.view === 'map' && previousRoute?.view !== 'map' && mapVisit) {
      restoreMapVisit();
      return;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!initial) $(`#${route.view} h1`)?.focus({ preventScroll: true });
  }

  function navigate(hash, source) {
    if (location.hash !== hash) {
      const atlasFromMap = activeRoute?.view === 'map' && hash.startsWith('#learn/');
      history.pushState({ atlasFromMap }, '', hash);
    }
    applyRoute(hash, { source });
  }

  function switchView(viewId, updateHash = true) {
    if (viewId === 'checkpoint') {
      openSettingsPanel(document.activeElement);
      return;
    }
    const hash = Object.hasOwn(VIEW_TITLES, viewId) && viewId !== 'learn' ? `#${viewId}` : '#home';
    if (updateHash) navigate(hash);
    else applyRoute(hash);
  }

  function handleHashChange() {
    applyRoute(location.hash);
  }

  function openSettingsPanel(invoker) {
    const panel = $('#settingsPanel');
    if (panel.open) return;
    settingsReturnFocus = invoker;
    renderCheckpoint();
    panel.showModal();
  }

  function closeSettingsPanel() {
    $('#settingsPanel').close();
    if (parseRoute(location.hash).view === 'checkpoint') {
      history.replaceState(null, '', activeHash || '#home');
    }
    if (settingsReturnFocus && !settingsReturnFocus.closest('[hidden], [inert]') && settingsReturnFocus !== document.body) {
      settingsReturnFocus.focus({ preventScroll: true });
    } else {
      (mobileNavigation.matches ? $('#menuButton') : $('#openSettingsButton')).focus({ preventScroll: true });
    }
  }

  function renderHomeReference() {
    const position = DATA.currentPosition;
    $('#positionPanel').innerHTML = `<h3>${escapeHTML(position.stage)}</h3>
      <p>${escapeHTML(position.identity)}. ${escapeHTML(position.mainGap)}</p>
      <p>${escapeHTML(position.foundation)}</p><p>${escapeHTML(position.ignoreNow)}</p>`;
    $('#baselineAudit').innerHTML = position.evidenceAudit.map((item) => `<article class="audit-item">
      <div><strong>${escapeHTML(item.name)}</strong><p>${escapeHTML(item.basis)}</p></div>${renderStatusBadge(item.status)}
    </article>`).join('');
    const ai = DATA.aiNativeEngineering;
    $('#aiNativeBanner').innerHTML = `<p>${escapeHTML(ai.workingMethod)}</p><h3>AI-independent skills</h3>${listHTML(ai.aiIndependentFloor)}`;
  }

  function updateHome(state, overview) {
    const task = overview.mission;
    const progress = $('#currentTaskProgress');
    progress.hidden = !task;
    if (task) updateProgressBadge(progress, nodeState(task, state).progress);
    $('#currentTaskTrack').textContent = task
      ? [overview.workingNode && 'Pinned', overview.missionPhase.name].filter(Boolean).join(' · ')
      : '';
    $('#currentTaskTitle').textContent = task?.name || 'You’re caught up';
    $('#currentTaskSummary').textContent = task?.summary || 'Explore the Career Map to revisit a capability or choose a new focus.';
    const link = $('#continueLearning');
    link.firstChild.textContent = task ? 'Continue learning ' : 'Open Career Map ';
    link.href = task ? taskLink(task.id) : '#map';

    const queue = $('#focusNextQueue');
    const queueIds = overview.nextTasks.map((item) => item.id).join(' ');
    if (queue.dataset.ids !== queueIds) {
      queue.dataset.ids = queueIds;
      queue.innerHTML = overview.nextTasks.map((item) => `<li><a href="${taskLink(item.id)}">
        <strong>${escapeHTML(item.name)}</strong><span aria-hidden="true">→</span>
      </a></li>`).join('');
    }
    $('#upcomingEmpty').hidden = Boolean(queueIds);

    const notice = $('#migrationNotice');
    notice.hidden = !state.legacyBackup;
    if (state.legacyBackup) {
      notice.textContent = `Your backup preserves ${state.legacyBackup.completedTaskCount} completed items across ${state.legacyBackup.taskCount} legacy task records.`;
    }
  }

  function taskResourceUsage(item, resource) {
    return DATA.taskResourceContext[item.id]?.[resource.id] || {
      role: resource.type,
      why: resource.why,
      selected: resource.relevantSections || resource.teaches,
      repeat: `Return when ${item.name} exposes a concrete implementation or reasoning question.`,
      stop: resource.doneWhen
    };
  }

  function getLearningResources(item, state) {
    const record = (resource) => {
      const verification = resourceVerification(resource, state);
      const usage = taskResourceUsage(item, resource);
      return {
        id: resource.id, title: resource.name, creator: resource.creator, url: resource.url,
        type: 'reference', usage, status: verification.status,
        lastVerified: verification.lastVerified, skip: resource.skipSections,
        verified: ['current', 'still-good'].includes(verification.status),
        sections: usage.selected, why: usage.why
      };
    };
    const mapped = item.resourceIds.map((id) => resources.get(id)).filter(Boolean);
    const alternatives = mapped.map((resource) => resources.get(resource.alternativeId)).filter(Boolean);
    const references = [...new Set([...mapped, ...alternatives])].map(record);
    const videos = DATA.orientationVideos.filter((video) => video.nodeIds.includes(item.id)).map((video) => ({
      ...video, type: 'orientation', verified: video.status === 'VERIFIED', sections: video.understandAfter
    }));
    const coursesForTask = DATA.youtubeLearning.filter((course) => course.nodeIds.includes(item.id)).map((course) => ({
      ...course, type: 'course', why: course.whySelected, verified: course.status === 'VERIFIED',
      sections: course.nodeSelections?.[item.id] || course.selectedSections
    }));
    const mainReference = references.find((resource) => resource.verified && /^primary\b/i.test(resource.usage.role));
    const recommended = mainReference
      || coursesForTask.find((course) => course.verified)
      || videos.find((video) => video.verified)
      || references.find((resource) => resource.verified);
    return { recommended, videos, courses: coursesForTask, references };
  }

  function resourceStatusText(resource) {
    return resource.type === 'reference' ? resource.status?.replaceAll('-', ' ') : resource.status;
  }

  function learningResourceLink(resource) {
    if (['unavailable', 'locked'].includes(resource.status)) return '';
    const label = resource.type === 'reference' ? 'Open resource' : courseLinkLabel(resource.url);
    return externalLink(resource.url, label);
  }

  function courseLinkLabel(url) {
    return new URL(url).hostname === 'www.youtube.com' ? 'Open on YouTube' : 'Open course';
  }

  function renderTaskResource(resource) {
    const typeLabels = { reference: resource.usage?.role, course: 'YouTube course', orientation: 'Orientation video' };
    return `<article class="task-resource-card">
      <h4>${escapeHTML(resource.title)}</h4>
      <p class="resource-record">${escapeHTML([typeLabels[resource.type], resource.creator, resource.duration, resource.level, resourceStatusText(resource), resource.lastVerified].filter(Boolean).join(' · '))}</p>
      ${resource.why ? `<p>${escapeHTML(resource.why)}</p>` : ''}
      ${resource.sections ? `<p><strong>${resource.type === 'orientation' ? 'Understand afterward' : 'Focus on'}</strong> ${escapeHTML(resource.sections)}</p>` : ''}
      ${resource.skip ? `<p><strong>Skip</strong> ${escapeHTML(resource.skip)}</p>` : ''}
      ${resource.usage?.repeat ? `<p>${escapeHTML(resource.usage.repeat)}</p>` : ''}
      ${resource.usage?.stop || resource.doneWhen ? `<p><strong>Done when</strong> ${escapeHTML(resource.usage?.stop || resource.doneWhen)}</p>` : ''}
      ${learningResourceLink(resource)}
    </article>`;
  }

  function renderWorkspaceResources(item, state) {
    const { recommended, videos, courses, references } = getLearningResources(item, state);
    const isOrientation = recommended?.type === 'orientation';
    $('#recommendedResource').innerHTML = recommended ? `
      <header>
        <p class="resource-category">Recommended resource</p>
        <h3>${escapeHTML(recommended.title)}</h3>
      </header>
      <div class="recommended-resource-action">${learningResourceLink(recommended)}
        <small>${escapeHTML([resourceStatusText(recommended), recommended.lastVerified].filter(Boolean).join(' · '))}</small>
      </div>
      <div class="recommended-resource-guidance">
        ${recommended.why ? `<p>${escapeHTML(recommended.why)}</p>` : ''}
        ${recommended.sections ? `<p><strong>${isOrientation ? 'Understand afterward' : 'Focus on'}</strong> ${escapeHTML(recommended.sections)}</p>` : ''}
      </div>` : `<p>${videos.length || courses.length || references.length
        ? 'No mapped resource is currently marked verified and available. Check the recorded statuses in Resource details.'
        : 'This capability has no mapped resource yet. Use the practice guidance below.'}</p>`;

    const videoNotice = videos.some((record) => record.verified)
      ? ''
      : '<p>No short orientation video has a verified record for this capability.</p>';
    $('#taskResourcesDetails').innerHTML = `${videoNotice}
      <div class="task-resource-list">${[...videos, ...courses, ...references].map(renderTaskResource).join('')}</div>`;
  }

  function renderPractice(item) {
    const lab = item.handsOnLab;
    if (!lab) {
      return `<p>${escapeHTML(item.miniExercise || item.projectApplication || item.ready || item.proof || item.completionCheck)}</p>`;
    }
    return `<div class="lab-card">
      <h3>${escapeHTML(lab.title)}</h3>
      <p>${escapeHTML(lab.goal)}</p>
      <ol class="lab-steps">${lab.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join('')}</ol>
      <div class="lab-outcome"><h4>Expected result</h4><p>${escapeHTML(lab.expectedResult)}</p></div>
      ${lab.stretch ? `<details class="reference-disclosure stretch-disclosure">
        <summary>Stretch challenge</summary><div class="reference-body"><p>${escapeHTML(lab.stretch)}</p></div>
      </details>` : ''}
    </div>`;
  }

  function renderWorkspace(id, state) {
    const container = $('#learn');
    const item = nodeLookup.get(id);
    renderedTask = item?.id || null;
    if (!item) {
      container.innerHTML = `<header class="view-heading"><h1 tabindex="-1">Capability unavailable</h1>
        <p>Choose a capability from the Career Map.</p><a class="button button-primary" href="#map">Back to Career Map</a></header>`;
      return;
    }

    const track = nodeTrack.get(id);
    const { progress, evidenceStatus, note } = nodeState(item, state);
    const prerequisites = item.prerequisites.length ? listHTML(item.prerequisites)
      : `<p>${escapeHTML(track.prerequisites || 'Use the active project and the preceding dependency as context.')}</p>`;
    const supporting = [
      ['Why now', item.whyNow], ['Career connection', item.careerConnection],
      ['Apply it in a project', item.projectApplication], ['Readiness', item.ready], ['What this unlocks', item.unlocks]
    ];
    const topics = [...new Set([...item.teaches, ...item.cover])].filter((topic) => topic !== item.whatIsThis);
    container.innerHTML = `<header class="workspace-header">
      <div class="workspace-topline"><a class="plain-link" href="#map" data-back-map>← Back to Career Map</a>
        <button type="button" class="button button-secondary button-small" data-pin-toggle="${escapeHTML(id)}" aria-pressed="false">Pin task</button>
      </div>
      <div class="workspace-meta"><span>${escapeHTML(track === DATA.sweDepth ? track.name + ' · Parallel track' : track.name)}</span>
        ${renderProgressBadge(progress, 'id="workspaceProgress"')}</div>
      <h1 tabindex="-1">${escapeHTML(item.name)}</h1>
      <p>${escapeHTML(item.summary)}</p>
      <nav class="section-jump-links workspace-jump-links" aria-label="Learning workspace sections">
        <a href="${taskLink(id, 'learn')}">Learn</a>
        <a href="${taskLink(id, 'practice')}">Practice</a>
        <a href="${taskLink(id, 'understanding')}">Check understanding</a>
        <a class="workspace-next-header" id="workspaceNextHeader" href="#map" aria-label="Next task" hidden>Next&nbsp;→</a>
      </nav>
    </header>
    <section class="workspace-section" id="workspace-learn" aria-labelledby="learnTitle">
      <h2 id="learnTitle" tabindex="-1">Learn</h2>
      <div class="workspace-copy">
        ${item.whatIsThis !== item.summary ? `<p>${escapeHTML(item.whatIsThis)}</p>` : ''}
        ${item.why !== item.summary && item.why !== item.whatIsThis ? `<p><strong>Why it matters</strong> ${escapeHTML(item.why)}</p>` : ''}
      </div>
      <div class="recommended-resource" id="recommendedResource"></div>
      <details class="reference-disclosure">
        <summary>Resource details</summary><div class="reference-body" id="taskResourcesDetails"></div>
      </details>
    </section>
    <section class="workspace-section" id="workspace-practice" aria-labelledby="practiceTitle">
      <h2 id="practiceTitle" tabindex="-1">Practice</h2>
      ${renderPractice(item)}
    </section>
    <section class="workspace-section" id="workspace-understanding" aria-labelledby="understandingTitle">
      <h2 id="understandingTitle" tabindex="-1">Check understanding</h2>
      <div class="workspace-copy"><h3>Explain it</h3><p>${escapeHTML(item.explainIt)}</p></div>
      <label class="completion-checkbox-label">
        <input type="checkbox" data-completion-check="${escapeHTML(id)}" ${progress === 'completed' ? 'checked' : ''}>
        <span>${escapeHTML(item.completionCheck)}</span>
      </label>
      <div class="workspace-progress-control">
        <label for="taskProgress">Progress</label>
        <select id="taskProgress" data-node-progress="${escapeHTML(id)}">${progressOptions(progress)}</select>
      </div>
      <details class="reference-disclosure">
        <summary>Notes</summary>
        <div class="reference-body"><label for="taskNotes">Task notes</label>
          <textarea id="taskNotes" data-node-note="${escapeHTML(id)}" maxlength="2000" rows="4" placeholder="Record decisions, edge cases, or questions">${escapeHTML(note)}</textarea>
        </div>
      </details>
      <div class="workspace-next" id="workspaceNext" hidden>
        <a class="button button-primary" id="nextLearningTask" href="#map"></a>
      </div>
    </section>
    <details class="reference-disclosure workspace-context">
      <summary>Prerequisites and career context</summary>
      <div class="reference-body">
        <h3>Prerequisites</h3>${prerequisites}
        ${supporting.filter(([, content]) => content).map(([label, content]) => `<h3>${label}</h3><p>${escapeHTML(content)}</p>`).join('')}
        ${topics.length ? `<h3>Topics to cover</h3>${listHTML(topics)}` : ''}
        ${item.skip.length ? `<h3>What to skip for now</h3>${listHTML(item.skip)}` : ''}
        ${item.miniExercise && item.handsOnLab ? `<h3>Mini exercise</h3><p>${escapeHTML(item.miniExercise)}</p>` : ''}
      </div>
    </details>
    <details class="reference-disclosure workspace-context">
      <summary>Evidence</summary>
      <div class="reference-body">
        ${item.evidenceBasis.length ? `<h3>Starting evidence</h3>${listHTML(item.evidenceBasis)}` : ''}
        ${item.proof && item.proof !== item.completionCheck ? `<h3>Evidence standard</h3><p>${escapeHTML(item.proof)}</p>` : ''}
        <label for="taskEvidenceStatus">Evidence status</label>
        <select id="taskEvidenceStatus" data-node-status="${escapeHTML(id)}">${Object.entries(DATA.statusLabels).map(([value, label]) => `<option value="${value}" ${evidenceStatus === value ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('')}</select>
      </div>
    </details>`;

    renderWorkspaceResources(item, state);
    updateWorkspace(state, getOverviewModel(state));
  }

  function progressOptions(progress) {
    return Object.entries(DATA.progressLabels).map(([value, label]) => `<option value="${value}" ${progress === value ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('');
  }

  function updateWorkspace(state, overview) {
    if (!renderedTask) return;
    const item = nodeLookup.get(renderedTask);
    const { progress, evidenceStatus, note } = nodeState(item, state);
    const pinned = state.workingNodeId === item.id;
    const pinButton = $('#learn [data-pin-toggle]');
    const checkbox = $('#learn [data-completion-check]');
    const notes = $('#taskNotes');
    const next = nextLearningTask(item, state, overview);

    updateProgressBadge($('#workspaceProgress'), progress);
    $('#taskProgress').value = progress;
    $('#taskEvidenceStatus').value = evidenceStatus;
    checkbox.checked = progress === 'completed';
    pinButton.setAttribute('aria-pressed', String(pinned));
    pinButton.textContent = pinned ? 'Unpin task' : 'Pin task';
    if (notes.value !== note) notes.value = note;
    const nextLink = $('#nextLearningTask');
    const nextInHeader = $('#workspaceNextHeader');
    nextInHeader.hidden = progress !== 'completed' || !next;
    $('#workspaceNext').hidden = nextInHeader.hidden;
    if (next) {
      nextLink.textContent = `Next: ${next.name} →`;
      nextLink.href = taskLink(next.id);
      nextInHeader.href = nextLink.getAttribute('href');
    }
  }

  function renderCapabilityRow(item, state) {
    return `<li class="capability-row" data-node-id="${escapeHTML(item.id)}">
      <a href="${taskLink(item.id)}">
        <strong>${escapeHTML(item.name)}</strong>
        <span class="capability-state"><span class="capability-context" data-capability-context hidden></span>
          ${renderProgressBadge(nodeState(item, state).progress, 'data-capability-progress')}
        </span>
        <span class="row-arrow" aria-hidden="true">→</span>
      </a>
    </li>`;
  }

  function renderTrack(track, state, open) {
    const parallel = track === DATA.sweDepth;
    const phaseContext = [
      ['Why this phase exists', track.why], ['Prerequisite', track.prerequisites],
      ['Project milestone', track.proof], ['What this unlocks', track.unlocks],
      ['Topics in this track', track.tags?.join(' · ')]
    ].filter(([, value]) => value);
    return `<details class="phase-card" data-phase-id="${escapeHTML(track.id || 'swe-depth')}" ${open ? 'open' : ''}>
      <summary class="phase-summary">
        ${parallel ? '<span class="phase-number" aria-hidden="true">∥</span>' : `<span class="phase-number" aria-hidden="true">${track.order}</span>`}
        <span class="phase-title"><strong>${escapeHTML(track.name)}</strong><small data-track-context>${parallel ? 'Parallel track' : ''}</small></span>
        <span class="phase-progress" data-track-progress></span>
        <span class="chevron" aria-hidden="true">›</span>
      </summary>
      <div class="phase-body">
        <p>${escapeHTML(track.summary)}</p>
        <ul class="capability-list">${track.nodes.map((item) => renderCapabilityRow(item, state)).join('')}</ul>
        ${phaseContext.length ? `<details class="reference-disclosure phase-reference"><summary>${parallel ? 'Track context' : 'Phase context'}</summary>
          <div class="reference-body">${phaseContext.map(([label, value]) => `<h3>${label}</h3><p>${escapeHTML(value)}</p>`).join('')}</div>
        </details>` : ''}
      </div>
    </details>`;
  }

  function renderPhases(state) {
    const overview = getOverviewModel(state);
    const current = overview.recommendedPhase || overview.missionPhase || overview.currentPhase;
    $('#phaseList').innerHTML = DATA.phases.map((phase) => renderTrack(phase, state, phase === current)).join('');
    $('#sweDepthTrack').innerHTML = renderTrack(DATA.sweDepth, state, DATA.sweDepth === current);
  }

  function updateMap(state, overview) {
    const nextIds = new Set([overview.recommended, ...overview.nextTasks].map((item) => item?.id));
    for (const group of $$('.phase-card')) {
      const track = group.dataset.phaseId === 'swe-depth' ? DATA.sweDepth : DATA.phases.find((phase) => phase.id === group.dataset.phaseId);
      const completed = track.nodes.filter((item) => nodeState(item, state).progress === 'completed').length;
      $('[data-track-progress]', group).textContent = `${completed}/${track.nodes.length} complete`;
      $('[data-track-context]', group).textContent = track === DATA.sweDepth ? 'Parallel track'
        : track === overview.recommendedPhase ? 'Current phase' : '';
      for (const row of $$('[data-node-id]', group)) {
        const id = row.dataset.nodeId;
        const { progress, evidenceStatus } = nodeState(nodeLookup.get(id), state);
        const context = $('[data-capability-context]', row);
        row.dataset.progress = progress;
        row.dataset.evidenceStatus = evidenceStatus;
        row.dataset.suggested = String(nextIds.has(id));
        const label = id === state.workingNodeId ? 'Pinned' : id === overview.recommended?.id ? 'Up next' : '';
        if (context.textContent !== label) context.textContent = label;
        context.hidden = !label;
        row.classList.toggle('capability-pinned', id === state.workingNodeId);
        updateProgressBadge($('[data-capability-progress]', row), progress);
      }
    }
    applyMapFilter();
  }

  function renderProjects(state) {
    $('#projectLadder').innerHTML = DATA.projects.map((project) => {
      const progress = state.progress[project.id]?.progress || project.status;
      const references = project.resourceIds.map((id) => resources.get(id)).filter(Boolean);
      const scope = [
        ['Scope', project.mvp], ['Why this project matters', project.whyThisProblem],
        ['Who it helps', project.whoItHelps], ['Optional starting project', project.optionalGreenfield],
        ['What to avoid overbuilding', project.whatNotToOverbuild]
      ];

      return `<details class="project-card" data-project-id="${escapeHTML(project.id)}">
        <summary class="project-summary">
          <span class="project-index" aria-hidden="true">${project.id.split('-').pop()}</span>
          <span class="project-summary-text"><strong>${escapeHTML(project.name)}</strong><span>${escapeHTML(project.purpose)}</span></span>
          ${renderProgressBadge(progress, 'data-project-progress')}
          <span class="chevron" aria-hidden="true">›</span>
        </summary>
        <div class="project-body">
          <section class="project-direction">
            <h2>Goal</h2><p>${escapeHTML(project.direction)}</p>
            ${project.recommendedBuild ? `<h3>Suggested build</h3><p>${escapeHTML(project.recommendedBuild)}</p>` : ''}
          </section>
          <section>
            <h2>What to demonstrate</h2>${listHTML(project.mustProve)}
          </section>
          <section class="project-proof">
            <h2>Completion standard</h2><p>${escapeHTML(project.completionCheck || project.proof)}</p>
          </section>
          <label class="workspace-progress-control">Milestone progress
            <select data-node-progress="${escapeHTML(project.id)}">${progressOptions(progress)}</select>
          </label>
          <details class="reference-disclosure">
            <summary>Scope and references</summary>
            <div class="reference-body">
              ${project.domainBadge ? `<p>${escapeHTML(project.domainBadge)}</p>` : ''}
              ${scope.filter(([, value]) => value).map(([label, value]) => `<h3>${label}</h3><p>${escapeHTML(value)}</p>`).join('')}
              ${project.technicalChallenges?.length ? `<h3>Technical challenges</h3>${listHTML(project.technicalChallenges)}` : ''}
              ${project.guardrails.length ? `<h3>Guardrails</h3>${listHTML(project.guardrails)}` : ''}
              ${project.proof !== project.completionCheck ? `<h3>Evidence</h3><p>${escapeHTML(project.proof)}</p>` : ''}
              ${references.length ? `<h3>Targeted references</h3><ul>${references.map((resource) => `<li>${externalLink(resource.url, resource.name)}</li>`).join('')}</ul>` : ''}
            </div>
          </details>
        </div>
      </details>`;
    }).join('');
  }

  function updateProjects(state, changedProjects) {
    for (const project of changedProjects) {
      const progress = state.progress[project.id]?.progress || project.status;
      const card = selectByData('data-project-id', project.id);
      updateProgressBadge($('[data-project-progress]', card), progress);
      $('select', card).value = progress;
    }
  }

  // Dynamic Role Readiness Calculation
  function calculateRoleReadiness(role, state) {
    const requiredNodes = (role.requiredNodeIds || []).map((id) => state.progress[id] || { progress: 'not-started' });
    const requiredProjects = (role.requiredProjects || []).map((id) => state.progress[id] || { progress: 'not-started' });

    const totalRequired = requiredNodes.length + requiredProjects.length;
    if (totalRequired === 0) return { state: role.state, label: role.label, reason: role.summary };

    const completedNodes = requiredNodes.filter((n) => n.progress === 'completed' || n.evidenceStatus === 'already-proven').length;
    const completedProjects = requiredProjects.filter((p) => p.progress === 'completed').length;
    const completedTotal = completedNodes + completedProjects;
    const inProgressTotal = requiredNodes.filter((n) => n.progress === 'in-progress').length;

    if (completedTotal === totalRequired) {
      return {
        state: 'apply-now',
        label: 'APPLY NOW',
        reason: `All ${totalRequired} core prerequisite capabilities and projects are completed!`
      };
    } else if (completedTotal >= Math.ceil(totalRequired * 0.6) || (completedTotal + inProgressTotal >= totalRequired)) {
      return {
        state: 'apply-selectively',
        label: 'APPLY SELECTIVELY',
        reason: `${completedTotal}/${totalRequired} required prerequisites completed (${inProgressTotal} in progress). Suitable for software-heavy or aligned roles.`
      };
    } else if (completedTotal > 0 || inProgressTotal > 0) {
      return {
        state: 'prepare-first',
        label: 'PREPARE FIRST',
        reason: `${completedTotal}/${totalRequired} prerequisites ready. Build the remaining foundational capabilities first.`
      };
    } else {
      return {
        state: 'not-yet',
        label: 'NOT YET',
        reason: `Prerequisite stage capabilities are still in early stages. Focus on foundational engineering.`
      };
    }
  }

  const readinessClasses = { 'apply-now': 'status-proven', 'apply-selectively': 'status-likely', 'prepare-first': 'status-partial', 'not-yet': 'status-not-needed' };

  function renderReadiness(state) {
    const platformById = new Map(DATA.discoveryStack.map((item) => [item.id, item]));
    const roleSearchUrl = (platform, query) => platform.searchPattern
      ? platform.searchPattern.replace('{query}', encodeURIComponent(query))
      : platform.url;

    const readinessGridEl = $('#readinessGrid');
    if (readinessGridEl) {
      readinessGridEl.innerHTML = DATA.roles.map((role) => {
        const dynamic = calculateRoleReadiness(role, state);
        const project = projectLookup.get(role.projectId);
        const platforms = role.platformIds.map((id) => platformById.get(id)).filter(Boolean);

        return `<details class="readiness-card" data-role-id="${escapeHTML(role.id)}">
          <summary class="readiness-head">
            <span><strong>${escapeHTML(role.name)}</strong><span>${escapeHTML(role.whatItDoes)}</span></span>
            <span class="status-badge ${readinessClasses[dynamic.state]}" data-role-status>${escapeHTML(dynamic.label)}</span>
            <span class="chevron" aria-hidden="true">›</span>
          </summary>
          <div class="role-launch-body">
            <div class="role-why">
              <p data-role-reason>${escapeHTML(dynamic.reason)}</p>
            </div>
            <div class="role-launch-grid">
              <section><span>Search these titles</span>${listHTML(role.searchTitles)}</section>
              <section><span>What you already have</span>${listHTML(role.have)}</section>
              <section><span>What the role usually needs</span>${listHTML(role.requirements)}</section>
              <section><span>Build or verify next</span>${listHTML(role.develop)}</section>
            </div>
            <section class="role-project">
              <span>Best project evidence</span>
              <h4>${escapeHTML(project?.name || 'Use the strongest authentic project')}</h4>
              <p>${escapeHTML(project?.proof || role.summary)}</p>
              ${project ? `<a class="inline-action" href="#projects/${encodeURIComponent(project.id)}">Open project evidence →</a>` : ''}
            </section>
            ${role.interviewExpectations ? `
              <div class="role-interview-box">
                <span>Technical Interview Focus:</span>
                <p>${escapeHTML(role.interviewExpectations)}</p>
              </div>
            ` : ''}
            <div class="role-launch-grid">
              <section><span>Resume emphasis</span>${listHTML(role.resume)}</section>
              <section><span>Skip the listing when</span>${listHTML(role.skipWhen)}</section>
            </div>
            <section class="role-search-actions">
              <span>Live search actions</span>
              <p>Queries use the shared discovery platforms. A readiness status guides; it never grants or withholds permission to apply.</p>
              <div>${platforms.flatMap((platform) => role.searchTitles.slice(0, 2).map((title) => `<a href="${escapeHTML(roleSearchUrl(platform, title))}" target="_blank" rel="noopener noreferrer">${escapeHTML(platform.name)} · ${escapeHTML(title)} ↗</a>`)).join('')}</div>
            </section>
          </div>
        </details>`;
      }).join('');
    }

    renderOpportunities();
    renderExperience();
    renderInternshipChecklist();
  }

  function updateReadiness(state) {
    for (const role of DATA.roles) {
      const readiness = calculateRoleReadiness(role, state);
      const card = selectByData('data-role-id', role.id);
      updateBadge($('[data-role-status]', card), readiness.label, readinessClasses[readiness.state]);
      $('[data-role-reason]', card).textContent = readiness.reason;
    }
  }

  function renderOpportunities() {
    const oppGrid = $('#opportunityGrid');
    if (oppGrid) {
      oppGrid.innerHTML = DATA.opportunities.map((item) => {
        // Presentation repair: display deadline property when item has no date property
        const displayDate = item.date || item.deadline || 'Date verification required';
        return `
          <article class="opportunity-card ${item.featured ? 'featured' : ''}" data-opportunity-id="${escapeHTML(item.id)}">
            <div class="opportunity-head">
              <div>
                <span class="kicker">Calendar Opportunity</span>
                <h3 tabindex="-1">${escapeHTML(item.name)}</h3>
              </div>
              <span class="status-badge ${item.featured ? 'status-proven' : 'status-likely'}">${escapeHTML(item.status)}</span>
            </div>
            <span class="opportunity-date">${escapeHTML(displayDate)}</span>
            <p>${escapeHTML(item.summary)}</p>
            ${item.eligibilityWarning ? `<div class="opportunity-warning"><strong>Eligibility Notice:</strong> <p>${escapeHTML(item.eligibilityWarning)}</p></div>` : ''}
            ${listHTML(item.actions)}
            <p><strong>${escapeHTML(item.note)}</strong></p>
            <div class="resource-footer">
              <span>Last verified ${escapeHTML(item.verified)} · reverify deadlines</span>
              ${externalLink(item.url, 'Official page')}
            </div>
          </article>`;
      }).join('');
    }

    const discStack = $('#discoveryStack');
    if (discStack) {
      discStack.innerHTML = `<span class="kicker">Discovery Platforms</span><h3>Find live roles, then compare requirements</h3><p>Prefer direct employer pages; use broad platforms for discovery while verifying engineering substance.</p><div class="discovery-links">${DATA.discoveryStack.map((item) => externalLink(item.url, item.name)).join('')}</div>`;
    }
  }

  function renderInternshipChecklist() {
    const container = $('#internshipChecklistContainer');
    if (!container || !DATA.internshipChecklist) return;
    const chk = DATA.internshipChecklist;
    container.innerHTML = `
      <div class="checklist-card">
        <div class="checklist-head">
          <span class="kicker">Quality Filter</span>
          <h3>${escapeHTML(chk.title)}</h3>
          <p>${escapeHTML(chk.summary)}</p>
        </div>
        <div class="checklist-grid">
          ${chk.criteria.map((c) => `
            <div class="checklist-item">
              <strong>✓ ${escapeHTML(c.label)}</strong>
              <p>${escapeHTML(c.check)}</p>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function renderExperience() {
    const expGrid = $('#experienceGrid');
    if (expGrid) {
      expGrid.innerHTML = DATA.experience.map((item) => `
        <article class="experience-card">
          <span class="icon">${escapeHTML(item.icon)}</span>
          <h3>${escapeHTML(item.name)}</h3>
          <p>${escapeHTML(item.summary)}</p>
          ${listHTML(item.items)}
        </article>`).join('');
    }
  }

  function renderProof() {
    const proofLoopEl = $('#proofLoop');
    if (proofLoopEl) {
      proofLoopEl.innerHTML = DATA.proofLoop.map((step) => `<div class="proof-step">${escapeHTML(step)}</div>`).join('');
    }
  }

  function renderResourceFilters() {
    const stages = [...new Set(DATA.resources.map((item) => item.stage))];
    const statuses = resourceStatuses;
    const stageSelect = $('#resourceStageFilter');
    const statusSelect = $('#resourceStatusFilter');
    if (!stageSelect || !statusSelect) return;

    const currentStage = stageSelect.value || 'all';
    const currentStatus = statusSelect.value || 'all';
    stageSelect.innerHTML = `<option value="all">All stages</option>${stages.map((stage) => `<option value="${escapeHTML(stage)}">${escapeHTML(stage.replaceAll('-', ' '))}</option>`).join('')}`;
    statusSelect.innerHTML = `<option value="all">All verification states</option>${statuses.map((status) => `<option value="${escapeHTML(status)}">${escapeHTML(status.replaceAll('-', ' '))}</option>`).join('')}`;
    stageSelect.value = stages.includes(currentStage) ? currentStage : 'all';
    statusSelect.value = statuses.includes(currentStatus) ? currentStatus : 'all';
  }

  function renderResources(state) {
    // Render YouTube Courses
    const ytGrid = $('#youtubeCourseGrid');
    if (ytGrid && DATA.youtubeLearning) {
      ytGrid.innerHTML = DATA.youtubeLearning.map((course) => `
        <article class="youtube-course-card" data-yt-id="${escapeHTML(course.id)}">
          <div class="yt-badge-row">
            <span class="yt-type-pill">${escapeHTML(course.type)}</span>
            <span class="video-status ${course.status === 'VERIFIED' ? 'verified' : 'unverified'}">${escapeHTML(course.status)}</span>
          </div>
          <h3 tabindex="-1">${escapeHTML(course.title)}</h3>
          <span class="yt-creator">${escapeHTML(course.creator)} · ${escapeHTML(course.duration)} · ${escapeHTML(course.level)}</span>
          <p class="yt-why">${escapeHTML(course.whySelected)}</p>
          <div class="yt-chapters">
            <strong>Selected Chapters:</strong>
            <p>${escapeHTML(course.selectedSections)}</p>
          </div>
          ${course.skip ? `<p class="yt-skip"><b>Skip:</b> ${escapeHTML(course.skip)}</p>` : ''}
          <div class="yt-footer">
            <span>Done when: ${escapeHTML(course.doneWhen)}</span>
            ${externalLink(course.url, courseLinkLabel(course.url))}
          </div>
        </article>
      `).join('');
    }

    const resGrid = $('#resourceGrid');
    if (resGrid) {
      resGrid.innerHTML = DATA.resources.map((resource) => {
        const verification = resourceVerification(resource, state);
        const badgeStatus = verificationClass(verification.status);
        return `<article class="resource-card" id="resource-${escapeHTML(resource.id)}" data-resource-id="${escapeHTML(resource.id)}">
          <div class="resource-meta"><span class="resource-id">${escapeHTML(resource.id)} · ${escapeHTML(resource.stage.replaceAll('-', ' '))}</span><span class="status-badge ${badgeStatus}" data-verification-badge>${escapeHTML(verification.status.replaceAll('-', ' '))}</span></div>
          <div class="resource-type-row">${renderResourceTypeBadge(resource)}</div>
          <h3 tabindex="-1">${escapeHTML(resource.name)}</h3><span class="resource-creator">${escapeHTML(resource.creator)} · ${escapeHTML(resource.platform)}</span>
          <span class="resource-purpose-label">Purpose</span><strong class="resource-purpose">${escapeHTML(resource.purpose)}</strong>
          <p class="resource-summary">${escapeHTML(resource.summary)}</p>
          <p class="resource-commitment"><strong>${escapeHTML(resource.cost)}</strong> · ${escapeHTML(resource.length)}</p>
          <details class="resource-guide">
            <summary><span>Start here — why this resource matters</span><span class="chevron">›</span></summary>
            <div class="resource-guide-body">
              <div><span>What is this?</span><p>${escapeHTML(resource.summary)}</p></div>
              <div><span>Why is this important?</span><p>${escapeHTML(resource.why)}</p></div>
              <div><span>What will this teach me?</span><p>${escapeHTML(resource.teaches)}</p></div>
              <div><span>How should I use it?</span><p>${escapeHTML(resource.howToUse)}</p></div>
              <div><span>Focus on</span><p>${escapeHTML(resource.relevantSections)}</p></div>
              <div><span>Skip / do not overdo</span><p>${escapeHTML(resource.skipSections)}</p></div>
              <div class="resource-done"><span>I am done when…</span><p>${escapeHTML(resource.doneWhen)}</p></div>
            </div>
          </details>
          <div class="resource-footer"><span class="resource-verified">Registry checked ${escapeHTML(resource.lastVerified)}<small data-personal-verification hidden></small></span>${externalLink(resource.url)}</div>
          <div class="resource-verification"><label>Verification state<select data-resource-status="${escapeHTML(resource.id)}">${resourceStatuses.map((value) => `<option value="${value}" ${verification.status === value ? 'selected' : ''}>${escapeHTML(value.replaceAll('-', ' '))}</option>`).join('')}</select></label></div>
        </article>`;
      }).join('');
    }
  }

  let revealedResourceId;

  function resourceVerification(resource, state) {
    const saved = state.resourceVerification[resource.id];
    return saved && resourceStatuses.includes(saved.status) ? saved : resource;
  }

  function verificationClass(status) {
    if (status === 'locked') return 'status-locked';
    if (status === 'current') return 'status-proven';
    if (status === 'unavailable') return 'status-missing';
    return 'status-likely';
  }

  function updateResources(state, changedResources) {
    for (const resource of changedResources) {
      const verification = resourceVerification(resource, state);
      const card = document.getElementById(`resource-${resource.id}`);
      updateBadge($('[data-verification-badge]', card), verification.status.replaceAll('-', ' '), verificationClass(verification.status));
      const personal = $('[data-personal-verification]', card);
      personal.hidden = !verification.lastVerified || verification.lastVerified === resource.lastVerified;
      personal.textContent = personal.hidden ? '' : `Your check: ${verification.lastVerified}`;
      $('select', card).value = verification.status;
      if (card.contains(document.activeElement)) revealedResourceId = resource.id;
    }
    applyResourceFilters(state);
  }

  function applyResourceFilters(state = getState()) {
    const stage = $('#resourceStageFilter').value;
    const status = $('#resourceStatusFilter').value;
    let visibleCount = 0;
    for (const resource of DATA.resources) {
      const verification = resourceVerification(resource, state);
      const matches = (stage === 'all' || resource.stage === stage) && (status === 'all' || verification.status === status);
      const card = document.getElementById(`resource-${resource.id}`);
      card.hidden = !matches && resource.id !== revealedResourceId;
      if (!card.hidden) visibleCount += 1;
    }
    $('#resourceEmpty').hidden = visibleCount > 0;
  }

  function revealResource(id) {
    revealedResourceId = id;
    applyResourceFilters();
    const card = document.getElementById(`resource-${id}`);
    $('.resource-guide', card).open = true;
    return revealTarget($('h3', card));
  }

  function renderGlossary() {
    $('#glossaryGrid').innerHTML = DATA.glossary.map((item) => `<article class="glossary-card" data-glossary-term="${escapeHTML(item.term)}">
      <h3 tabindex="-1">${escapeHTML(item.term)}</h3><p>${escapeHTML(item.definition)}</p>
    </article>`).join('');
  }

  const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function renderMetadataRows(rows) {
    return `<div class="metadata-list">${rows.filter(([, value]) => value).map(([label, value]) => `<div class="metadata-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join('')}</div>`;
  }

  function effectivePolicyVerification(policy) {
    const next = policy.nextRevalidationPoint;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next || '')) return policy.verificationStatus;
    const revalidationTime = new Date(`${next}T00:00:00`).getTime();
    const lastVerified = new Date(`${policy.lastVerified}T00:00:00`).getTime();
    return Date.now() >= revalidationTime && lastVerified < revalidationTime ? 'OUTDATED' : policy.verificationStatus;
  }

  function renderPolicyCard(policy) {
    const verification = effectivePolicyVerification(policy);
    const isSuperseded = policy.policyState === 'SUPERSEDED' || policy.policyState === 'HISTORICAL';
    const rows = [
      ['Effective date', policy.effectiveDate], ['Closure date', policy.closureDate], ['Applies to', policy.appliesTo],
      ['Change risk', policy.changeRisk], ['Last verified', policy.lastVerified], ['Next revalidation', policy.nextRevalidationPoint], ['Superseded by', policy.supersededBy]
    ];
    return `<details class="policy-card ${isSuperseded ? 'policy-card-superseded' : ''}">
      <summary><div><span class="kicker">Rule / policy</span><h4>${escapeHTML(policy.rule)}</h4>${policy.value ? `<strong class="policy-value">${escapeHTML(policy.value)}</strong>` : ''}</div><div class="policy-badges"><span class="policy-badge verification-${slug(verification)}">Verification: ${escapeHTML(verification)}</span><span class="policy-badge state-${slug(policy.policyState)}">Policy: ${escapeHTML(policy.policyState)}</span></div><span class="chevron">›</span></summary>
      <div class="policy-body"><div class="policy-copy"><span>Currently confirmed</span><p>${escapeHTML(policy.confirmed)}</p></div><div class="policy-copy"><span>Strategic implication</span><p>${escapeHTML(policy.implication)}</p></div>${policy.freshnessRule ? `<div class="policy-alert"><strong>Freshness rule</strong><p>${escapeHTML(policy.freshnessRule)}</p></div>` : ''}${renderMetadataRows(rows)}<div class="policy-source">${externalLink(policy.source.url, policy.source.name)}</div></div>
    </details>`;
  }

  function renderProgramCard(program) {
    const identityRows = [
      ['University', program.university], ['Exact program', program.programName], ['Credential', program.credential], ['Program route', program.routes.join(' · ')],
      ['Specialization', program.specialization], ['Campus', program.campus], ['Mode', program.mode], ['Normal length', program.normalLength], ['Available intakes', program.intakes],
      ['DLI number', program.dliNumber], ['DLI campus match', program.dliCampusMatch], ['Current PGWP / campus implication', program.pgwpByCampus],
      ['Campus-specific route availability', program.campusRouteAvailability], ['Admission language', program.admissionLanguage], ['PGWP language', program.pgwpLanguage],
      ['Current cost', program.currentCost], ['Funding / scholarships', program.funding], ['Co-op / internship', program.experience], ['Research', program.research], ['Last verified', program.lastVerified]
    ];
    return `<details class="program-card">
      <summary><div><span class="kicker">${escapeHTML(program.classification)}</span><h3>${escapeHTML(program.university)}</h3><p>${escapeHTML(program.programName)} · ${escapeHTML(program.credential)}</p></div><div class="program-assessment"><span><small>Profile fit</small><strong>${escapeHTML(program.competitiveness)}</strong></span><span><small>Assessment confidence</small><strong>${escapeHTML(program.assessmentConfidence)}</strong></span></div><span class="chevron">›</span></summary>
      <div class="program-body"><div class="program-route-strip">${program.routes.map((route) => `<span>${escapeHTML(route)}</span>`).join('')}</div>${renderMetadataRows(identityRows)}<div class="program-columns"><div><span class="kicker">Evidence basis</span><p>${escapeHTML(program.evidenceBasis)}</p><span class="kicker">Key verification needed</span>${listHTML(program.keyVerification)}</div><div><span class="kicker">Major advantages</span>${listHTML(program.advantages)}<span class="kicker">Major trade-offs</span>${listHTML(program.tradeoffs)}</div></div><div class="policy-source">${externalLink(program.source.url, program.source.name)}</div></div>
    </details>`;
  }

  function renderEducation() {
    const education = DATA.education;
    const horizon = education.planningHorizon;
    const snapshot = education.policySnapshot;
    const lakeheadProgram = education.universitySnapshot.programs.find((program) => program.id === 'lakehead-msc-cs');
    
    // Subnav desktop tablist
    const subnavEl = $('#educationSubnav');
    if (subnavEl) {
      subnavEl.innerHTML = education.sectionNav.map(([id, label]) => `<button type="button" role="tab" id="education-tab-${escapeHTML(id)}" aria-controls="education-panel-${escapeHTML(id)}" aria-selected="${id === activeEducationSection}" tabindex="${id === activeEducationSection ? '0' : '-1'}" data-education-tab="${escapeHTML(id)}">${escapeHTML(label)}</button>`).join('');
    }

    // Subnav mobile dropdown
    const mobileSelectEl = $('#educationMobileSelect');
    if (mobileSelectEl) {
      mobileSelectEl.innerHTML = education.sectionNav.map(([id, label]) => `<option value="${escapeHTML(id)}" ${id === activeEducationSection ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('');
    }

    const panels = [
      ['overview', `
        <article class="education-card"><div class="education-horizon"><div><span class="kicker">${escapeHTML(horizon.label)}</span><strong>${escapeHTML(horizon.value)}</strong></div><span class="policy-badge verification-reverify-soon">${escapeHTML(horizon.status)}</span></div><p>${escapeHTML(horizon.reference)}</p><p><strong>${escapeHTML(horizon.objective)}</strong></p><div class="strategy-guardrail">${escapeHTML(horizon.meaning)}</div></article>
        <div class="education-map-grid">${education.hierarchy.map((map) => `<article class="education-card"><span class="kicker">${escapeHTML(map.label)} · ${escapeHTML(map.role)}</span><h3>${escapeHTML(map.name)}</h3><p>${escapeHTML(map.summary)}</p></article>`).join('')}</div>
        <article class="education-card"><span class="kicker">Career independence</span><h3>${escapeHTML(education.valueBuilding.title)}</h3><p>${escapeHTML(education.valueBuilding.summary)}</p><div class="tag-list">${education.valueBuilding.assets.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><div class="strategy-guardrail"><strong>${escapeHTML(education.valueBuilding.experienceLabel)}</strong> ${escapeHTML(education.valueBuilding.guardrail)}</div></article>
        <div class="education-section-intro"><div><span class="kicker">Current verified snapshot · ${escapeHTML(snapshot.referenceDate)}</span><h3>Canada policy reference</h3><p>${escapeHTML(snapshot.note)}</p></div><span class="policy-badge verification-current">${escapeHTML(snapshot.status)}</span></div>
        <div class="policy-grid">${snapshot.records.map(renderPolicyCard).join('')}</div>`],
      ['education-strategy', `
        <div class="education-two-column"><article class="education-card"><span class="kicker">Current education position</span><h3>Bachelor’s progression</h3>${renderMetadataRows(education.metadata)}</article><article class="education-card"><span class="kicker">Master’s decision system</span><h3>Compare the exact route, not a university label</h3><p>${escapeHTML(education.mastersDecision.principle)}</p><div class="tag-list">${education.mastersDecision.routes.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div>${listHTML(education.mastersDecision.guardrails)}</article></div>
        <article class="education-card"><span class="kicker">Admission preparation</span><h3>Evidence to refresh when applications become real</h3>${listHTML(education.mastersDecision.preparation)}</article>
        <article class="education-card"><span class="kicker">Professional experience · ${escapeHTML(education.valueBuilding.experienceLabel)}</span><h3>Arrive with professional value when opportunity allows</h3><div class="experience-flow">${education.valueBuilding.experienceFlow.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><p>${escapeHTML(education.valueBuilding.guardrail)}</p></article>`],
      ['university-options', `
        <div class="education-section-intro"><div><span class="kicker">${escapeHTML(education.universitySnapshot.title)}</span><h3>Five strategic comparisons</h3><p>${escapeHTML(education.universitySnapshot.rule)}</p></div><span class="policy-badge verification-reverify-soon">${escapeHTML(education.universitySnapshot.status)}</span></div>
        <div class="program-grid">${education.universitySnapshot.programs.map(renderProgramCard).join('')}</div>`],
      ['lakehead-alternatives', `
        <article class="education-card"><span class="kicker">${escapeHTML(education.lakehead.classification)}</span><h3>Lakehead is a legitimate option—not an automatic recommendation</h3><p>${escapeHTML(education.lakehead.decisionRule)}</p><div class="route-comparison">${education.lakehead.routeTradeoff.map((route) => `<div><strong>${escapeHTML(route.route)}</strong><span>${escapeHTML(route.value)}</span><p>${escapeHTML(route.constraint)}</p></div>`).join('')}</div></article>
        <div class="campus-grid">${education.lakehead.campuses.map((campus) => `<article class="education-card"><div class="campus-head"><div><span class="kicker">Campus-specific identity</span><h3>${escapeHTML(campus.campus)}</h3></div><span class="policy-badge ${campus.dliCampusMatch === 'VERIFIED' ? 'verification-current' : 'verification-unknown'}">DLI match: ${escapeHTML(campus.dliCampusMatch)}</span></div>${renderMetadataRows([['Program availability', campus.programAvailability], ['DLI number', campus.dliNumber], ['PGWP / immigration by campus', campus.pgwpByCampus], ['Campus route availability', campus.campusRouteAvailability], ['Last verified', campus.lastVerified]])}${campus.action ? `<div class="policy-alert"><strong>Action before reliance</strong><p>${escapeHTML(campus.action)}</p></div>` : ''}<div class="policy-source">${externalLink(campus.officialCampusSource.url, campus.officialCampusSource.name)}</div></article>`).join('')}</div>
        <article class="education-card"><span class="kicker">Decision dimensions remain separate</span><h3>Career value ≠ immigration value ≠ personal / life value</h3><div class="tag-list">${education.valueDimensions.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><p>No single combined score decides Lakehead or any alternative.</p></article>`],
      ['location-analysis', `
        <article class="education-card"><span class="kicker">Location decision · separate from university decision</span><h3>${escapeHTML(education.locationAnalysis.location)} ≠ ${escapeHTML(education.locationAnalysis.distinctFrom)}</h3><div class="status-callout"><strong>${escapeHTML(education.locationAnalysis.status)}</strong><p>${escapeHTML(education.locationAnalysis.question)}</p></div><div class="research-grid">${education.locationAnalysis.research.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div></article>`],
      ['language-strategy', `
        <div class="language-grid">${education.languageStrategy.map((item) => `<article class="education-card"><span class="kicker">Language purpose</span><h3>${escapeHTML(item.purpose)}</h3><p>${escapeHTML(item.summary)}</p>${listHTML(item.questions)}<div class="strategy-guardrail"><strong>Revalidate</strong> ${escapeHTML(item.revalidate)}</div></article>`).join('')}</div>
        <article class="education-card"><span class="kicker">Permanent distinction</span><h3>Admission language ≠ PGWP language ≠ immigration language</h3><p>ATLAS does not create one generic IELTS node. The accepted test, score, validity, timing and purpose must be verified independently.</p></article>`],
      ['financial-planning', `
        <div class="education-two-column"><article class="education-card"><span class="kicker">${escapeHTML(education.finances.published.status)}</span><h3>${escapeHTML(education.finances.published.title)}</h3>${listHTML(education.finances.published.items)}<p class="small-note">Last verified ${escapeHTML(education.finances.published.lastVerified)}</p></article><article class="education-card"><span class="kicker">${escapeHTML(education.finances.future.status)}</span><h3>${escapeHTML(education.finances.future.title)}</h3>${listHTML(education.finances.future.items)}</article></div>
        <article class="education-card"><span class="kicker">Study-permit reference ≠ living-cost estimate</span><h3>Keep financial meanings separate</h3><p>${escapeHTML(education.finances.studyPermitReference)}</p><div class="strategy-guardrail">${escapeHTML(education.finances.guardrail)}</div></article>
        <article class="education-card"><span class="kicker">${escapeHTML(education.finances.horizon.title)}</span><h3>${escapeHTML(education.finances.horizon.status)}</h3><p>${escapeHTML(education.finances.horizon.trigger)}</p><div class="tag-list">${education.finances.resourceClasses.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div></article>`],
      ['canada-requirements', `
        <article class="education-card"><span class="kicker">Exact-program rule</span><h3>Eligibility is never inherited from a university name</h3><p>${escapeHTML(education.canadaRequirements.programIdentityRule)}</p><div class="strategy-guardrail"><strong>PGWP revalidation required</strong> before accepting an offer or paying a substantial deposit.</div></article>
        <article class="education-card"><span class="kicker">Decision checklist</span><h3>Before committing significant money</h3>${listHTML(education.canadaRequirements.beforeCommitment)}</article>
        <div class="education-two-column"><article class="education-card"><span class="kicker">Work evidence</span><h3>Two different questions</h3><p><strong>Career:</strong> does this make me a stronger engineer?</p><p><strong>Immigration:</strong> does this exact experience qualify under the pathway being evaluated?</p><p>${escapeHTML(education.canadaRequirements.workEvidenceRule)}</p></article><article class="education-card"><span class="kicker">Remote work</span><h3>Career opportunity, not assumed funding</h3><p>${escapeHTML(education.canadaRequirements.remoteWorkRule)}</p></article></div>`],
      ['immigration-reference', `
        <article class="education-card"><div class="education-section-intro"><div><span class="kicker">Strategic reference</span><h3>${escapeHTML(education.immigrationReference.title)}</h3></div><span class="policy-badge verification-reverify-soon">${escapeHTML(education.immigrationReference.status)}</span></div><p>${escapeHTML(education.immigrationReference.summary)}</p><div class="tag-list">${education.immigrationReference.categories.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><div class="strategy-guardrail">${escapeHTML(education.immigrationReference.guardrail)}</div></article>
        <article class="education-card"><span class="kicker">Reference-card scope</span><h3>Research only what is decision-relevant</h3>${listHTML(education.immigrationReference.cardQuestions)}</article>
        <div class="policy-grid">${snapshot.records.filter((item) => item.id === 'oinp-masters-graduate').map(renderPolicyCard).join('')}</div>`],
      ['decision-checkpoints', `
        <article class="education-card"><span class="kicker">Decision triggers · never deadlines</span><h3>Revalidate when the decision becomes actionable</h3><p>No countdown pressure and no overdue engineering states.</p></article>
        <div class="checkpoint-timeline">${education.checkpoints.map((item, index) => `<details class="checkpoint-trigger" ${index === 0 ? 'open' : ''}><summary><span>${String(index + 1).padStart(2, '0')}</span><div><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.trigger)}</p></div><span class="chevron">›</span></summary><div>${listHTML(item.verify)}</div></details>`).join('')}</div>`],
      ['canada-trajectory', `
        <article class="education-card"><span class="kicker">Canada trajectory · separate from Career trajectory</span><h3>${escapeHTML(horizon.value)} · ${escapeHTML(horizon.status)}</h3><p>${escapeHTML(horizon.meaning)}</p></article>
        <div class="canada-trajectory">${education.canadaTrajectory.map((item) => `<article class="canada-trajectory-item"><span>${escapeHTML(item.period)}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detail)}</p></div></article>`).join('')}</div>
        <article class="education-card"><span class="kicker">Global guardrail</span><h3>Canada remains optional</h3><p>${escapeHTML(education.globalGuardrail)}</p></article>`]
    ];

    const layoutEl = $('#educationLayout');
    if (layoutEl) {
      layoutEl.innerHTML = panels.map(([id, content]) => `<section class="education-panel" id="education-panel-${escapeHTML(id)}" role="tabpanel" aria-labelledby="education-tab-${escapeHTML(id)}" data-education-panel="${escapeHTML(id)}" tabindex="0" ${id === activeEducationSection ? '' : 'hidden'}>${content}</section>`).join('');
    }
  }

  function showEducationPanel(id) {
    if (!DATA.education.sectionNav.some(([sectionId]) => sectionId === id)) return;
    activeEducationSection = id;
    $$('[data-education-tab]').forEach((button) => {
      const selected = button.dataset.educationTab === id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    const mobileSelectEl = $('#educationMobileSelect');
    if (mobileSelectEl && mobileSelectEl.value !== id) {
      mobileSelectEl.value = id;
    }
    $$('[data-education-panel]').forEach((panel) => { panel.hidden = panel.dataset.educationPanel !== id; });
  }

  function renderTrajectory() {
    const trajList = $('#trajectoryList');
    if (trajList) {
      trajList.innerHTML = DATA.trajectory.map((item) => `
        <article class="trajectory-item"><span class="trajectory-period">${escapeHTML(item.period)}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detail)}</p></div></article>`).join('');
    }
  }

  function buildCheckpointSnapshot(state) {
    const overview = getOverviewModel(state);
    const allRequired = [...DATA.phases.flatMap((phase) => phase.nodes), ...DATA.sweDepth.nodes]
      .filter((item) => ![DATA.status.OPTIONAL, DATA.status.NOT_NEEDED, DATA.status.LOCKED].includes(state.progress[item.id]?.evidenceStatus || item.evidenceStatus));
    const remaining = allRequired.filter((item) => (state.progress[item.id]?.progress || item.defaultProgress) !== 'completed');
    const provenEvidence = state.evidence.slice(0, 5);
    const staleResources = DATA.resources.filter((resource) => {
      const verification = state.resourceVerification[resource.id];
      return verification && verification.status !== 'current';
    });
    return {
      stage: DATA.currentPosition.stage,
      missionId: overview.mission?.id || null,
      mission: overview.mission?.name || 'No unresolved tasks queued',
      missionFirstAction: overview.mission ? getLearningResources(overview.mission, state).recommended?.title || '' : '',
      evidenceCount: state.evidence.length,
      evidence: provenEvidence.map((item) => item.label),
      remaining: remaining.slice(0, 6).map((item) => item.name),
      next: overview.nextTasks.map((item) => ({ id: item.id, name: item.name, firstAction: '' })),
      verifyOnce: overview.verifyOnce.map((item) => ({ id: item.id, name: item.name })),
      project: overview.project.name,
      ignore: DATA.currentPosition.ignoreNow,
      opportunities: DATA.roles.filter((role) => ['apply-now', 'apply-selectively'].includes(calculateRoleReadiness(role, state).state)).map((role) => role.name),
      staleResources: staleResources.slice(0, 6).map((resource) => resource.name)
    };
  }

  function renderCheckpoint(record = false, state = getState()) {
    const snapshot = buildCheckpointSnapshot(state);
    if (record) {
      STORE.recordCheckpoint(snapshot);
      toast('Career GPS snapshot saved locally.');
      return;
    }
    const lastRun = state.careerCheckpoint.lastRunAt;
    const cards = [
      ['Where am I now?', snapshot.stage, 'Software Engineering Core unlocks serious ML. Professional SWE Depth continues in parallel.'],
      ['Current Focus / Mission', snapshot.mission, snapshot.missionId ? `${snapshot.missionFirstAction ? `<p>Start with ${escapeHTML(snapshot.missionFirstAction)}.</p>` : ''}<a class="inline-action" href="${taskLink(snapshot.missionId)}">Open learning workspace →</a>` : ''],
      ['What follows?', `${snapshot.next.length} queued task${snapshot.next.length === 1 ? '' : 's'}`, snapshot.next.length ? `<ol class="checkpoint-actions">${snapshot.next.map((item) => `<li><a class="inline-action" href="${taskLink(item.id)}">${escapeHTML(item.name)}</a></li>`).join('')}</ol>` : '<p>Complete current capabilities to advance to subsequent phases.</p>'],
      ['What should I verify once?', `${snapshot.verifyOnce.length} claim${snapshot.verifyOnce.length === 1 ? '' : 's'}`, snapshot.verifyOnce.length ? `<ul>${snapshot.verifyOnce.map((item) => `<li><a class="inline-action" href="${taskLink(item.id)}">${escapeHTML(item.name)}</a></li>`).join('')}</ul>` : '<p>No current verify-once items are waiting.</p>'],
      ['Personal notes and state', `${snapshot.evidenceCount} saved evidence / notes`, 'Capability self-assessments and notes stay stored locally.'],
      ['Which project carries the proof?', snapshot.project, '<p>Upgrade the best authentic existing application. Open Project 1 from Projects ladder.</p>'],
      ['What can I ignore?', 'Not needed now', escapeHTML(snapshot.ignore)],
      ['Which opportunities are relevant?', 'Apply where capabilities overlap', `<ul>${snapshot.opportunities.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`],
      ['Resource freshness', `${snapshot.staleResources.length} need attention`, snapshot.staleResources.length ? `<ul>${snapshot.staleResources.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : 'All registered resources verified.'],
      ['Roadmap calibration', 'Recalibrate when facts change', `Last snapshot: ${lastRun ? escapeHTML(new Date(lastRun).toLocaleString()) : 'not yet recorded'}.`]
    ];

    const cardsHTML = cards.map(([question, title, body]) => `<article class="checkpoint-card"><span class="question">${escapeHTML(question)}</span><h3>${escapeHTML(title)}</h3>${String(body).startsWith('<') ? body : `<p>${body}</p>`}</article>`).join('');

    $('#checkpointGrid').innerHTML = cardsHTML;
  }

  function renderProgress(state) {
    $('#overallProgressText').textContent = `${baselineCapabilityCoverage()}%`;
    $('#actionProgressText').textContent = String(actionCompletionCount(state));
  }

  function renderMapStatusFilter() {
    $('#mapStatusFilter').innerHTML = `<option value="all">All capabilities</option>
      <option value="suggested">Suggested next</option>
      <option value="in-progress">In progress</option>
      <option value="completed">Completed</option>
      <option value="not-started">Not started</option>
      <optgroup label="Evidence status">
        ${Object.entries(DATA.statusLabels).map(([value, label]) => `<option value="evidence:${value}">${escapeHTML(label)}</option>`).join('')}
      </optgroup>`;
  }

  function applyMapFilter() {
    const filter = $('#mapStatusFilter').value;
    let matches = 0;
    for (const group of $$('.phase-card')) {
      let visible = 0;
      for (const row of $$('[data-node-id]', group)) {
        const { progress, suggested, evidenceStatus } = row.dataset;
        row.hidden = !['all', progress, `evidence:${evidenceStatus}`].includes(filter)
          && !(filter === 'suggested' && suggested === 'true');
        if (!row.hidden) visible += 1;
      }
      group.hidden = !visible;
      matches += visible;
    }
    $('#mapEmpty').hidden = Boolean(matches);
  }

  function updateStateViews(state, before) {
    const changedProgress = Object.keys(state.progress).filter((id) => {
      const { progress, evidenceStatus } = state.progress[id];
      const old = before?.progress[id];
      return progress !== old?.progress || evidenceStatus !== old?.evidenceStatus;
    });
    const capabilitiesChanged = changedProgress.some((id) => nodeLookup.has(id));
    const changedProjects = changedProgress.filter((id) => projectLookup.has(id)).map((id) => projectLookup.get(id));
    const pinChanged = state.workingNodeId !== before?.workingNodeId;
    const legacyChanged = !before || JSON.stringify(state.legacyBackup) !== JSON.stringify(before.legacyBackup);
    const changedResources = DATA.resources.filter(({ id }) => {
      const current = state.resourceVerification[id];
      const old = before?.resourceVerification[id];
      return !before || current?.status !== old?.status || current?.lastVerified !== old?.lastVerified;
    });

    if (capabilitiesChanged || pinChanged || legacyChanged) {
      const overview = getOverviewModel(state);
      updateHome(state, overview);
      updateMap(state, overview);
      updateWorkspace(state, overview);
    } else if (renderedTask) {
      const note = state.progress[renderedTask]?.note ?? '';
      if ($('#taskNotes').value !== note) $('#taskNotes').value = note;
    }
    if (changedProjects.length) updateProjects(state, changedProjects);
    if (capabilitiesChanged || changedProjects.length) {
      updateReadiness(state);
      renderProgress(state);
    }
    if (changedResources.length) {
      updateResources(state, changedResources);
      const task = nodeLookup.get(renderedTask);
      if (task && changedResources.some(({ id }) => task.resourceIds.includes(id)
        || task.resourceIds.some((mappedId) => resources.get(mappedId)?.alternativeId === id))) {
        renderWorkspaceResources(task, state);
      }
    }
    if ($('#settingsPanel').open) renderCheckpoint(false, state);
    previousState = state;
  }

  function renderAll() {
    updateStateViews(getState());
  }

  function openNode(nodeId) {
    navigate(taskLink(nodeId), document.activeElement);
  }

  function openProject(projectId) {
    navigate(`#projects/${encodeURIComponent(projectId)}`);
  }

  function openRole(roleId) {
    navigate(`#readiness/role/${encodeURIComponent(roleId)}`);
  }

  function openResource(resourceId) {
    navigate(`#resources/${encodeURIComponent(resourceId)}`);
  }

  function buildSearchIndex() {
    const record = (type, title, hash, snippet, ...terms) => ({
      type, title, hash, snippet,
      name: title.toLowerCase(),
      text: [title, snippet, ...terms].flat(Infinity).join(' ').toLowerCase()
    });
    return [
      ...capabilityNodes.flatMap((item) => {
        const capability = record('Capability', item.name, taskLink(item.id), item.summary,
          item.id, item.whatIsThis, item.teaches, item.whyNow, item.completionCheck);
        if (!item.handsOnLab) return [capability];
        return [capability, record('Lab', item.handsOnLab.title, taskLink(item.id, 'practice'),
          item.handsOnLab.goal, item.name, item.id, item.handsOnLab.steps)];
      }),
      ...DATA.projects.map((item) => record('Project', item.name, `#projects/${encodeURIComponent(item.id)}`,
        item.purpose, item.id, item.domainBadge, item.direction, item.mustProve)),
      ...DATA.roles.map((item) => record('Career role', item.name, `#readiness/role/${encodeURIComponent(item.id)}`,
        item.whatItDoes, item.id, item.searchTitles, item.requirements)),
      ...DATA.opportunities.map((item) => record('Opportunity', item.name, `#readiness/opportunity/${encodeURIComponent(item.id)}`,
        item.summary, item.id, item.status, item.actions)),
      ...DATA.youtubeLearning.map((item) => record('YouTube course', item.title, `#resources/course/${encodeURIComponent(item.id)}`,
        item.whySelected, item.id, item.creator, item.selectedSections)),
      ...DATA.resources.map((item) => record('Resource', item.name, `#resources/${encodeURIComponent(item.id)}`,
        item.purpose, item.id, item.creator, item.summary, item.relevantSections)),
      ...DATA.glossary.map((item) => record('Glossary term', item.term, `#resources/glossary/${encodeURIComponent(item.term)}`, item.definition)),
      ...DATA.education.sectionNav.map(([id, title]) => record('Education & Canada', title, `#education/${encodeURIComponent(id)}`, '', id))
    ];
  }

  let searchIndex;

  function performGlobalSearch(query) {
    const term = query.trim().toLowerCase();
    if (!term) {
      closeSearchPanel();
      return;
    }
    searchIndex ||= buildSearchIndex();
    const words = term.split(/\s+/);
    const rank = (item) => {
      if (item.name === term || decodeRouteId(item.hash.split('/').at(-1)).toLowerCase() === term) return 0;
      if (item.name.startsWith(term)) return 1;
      if (item.name.includes(term)) return 2;
      if (item.text.includes(term)) return 3;
      return 4;
    };
    const matches = searchIndex.filter((item) => words.every((word) => item.text.includes(word)))
      .sort((first, second) => rank(first) - rank(second));
    const shown = matches.slice(0, 10);

    $('#searchResultsPanel').hidden = false;
    $('#searchResultsCount').textContent = matches.length > shown.length
      ? `Top ${shown.length} of ${matches.length} results`
      : `${matches.length} result${matches.length === 1 ? '' : 's'}`;
    $('#searchResultsList').innerHTML = shown.length ? shown.map((item) => `
      <a class="search-result-item" href="${escapeHTML(item.hash)}">
        <span class="search-result-head"><strong>${escapeHTML(item.title)}</strong><span class="search-result-dest">${escapeHTML(item.type)}</span></span>
        ${item.snippet ? `<span class="search-result-snippet">${escapeHTML(item.snippet)}</span>` : ''}
      </a>`).join('') : `<p class="search-results-empty">No results for “${escapeHTML(query.trim())}”.</p>`;
  }

  function closeSearchPanel(restoreFocus = false) {
    $('#searchResultsPanel').hidden = true;
    if (restoreFocus) $('#globalSearch').focus();
  }

  function handleSearchKeys(event) {
    if (event.key === 'Escape' && !$('#searchResultsPanel').hidden) {
      event.preventDefault();
      closeSearchPanel(true);
      return;
    }
    if ($('#searchResultsPanel').hidden && event.target === $('#globalSearch') && ['ArrowDown', 'Enter'].includes(event.key)) {
      performGlobalSearch(event.target.value);
    }
    if ($('#searchResultsPanel').hidden) return;
    const results = $$('.search-result-item');
    if (event.key === 'Enter' && event.target === $('#globalSearch') && results.length) {
      event.preventDefault();
      results[0].click();
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !results.length) return;
    event.preventDefault();
    const index = results.indexOf(document.activeElement);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const next = index < 0 ? (direction > 0 ? 0 : results.length - 1) : (index + direction + results.length) % results.length;
    results[next].focus();
  }

  function downloadBackup() {
    const payload = STORE.exportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atlas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    toast('ATLAS backup downloaded.');
  }

  function setTheme(theme) {
    const next = STORE.setTheme(theme);
    document.documentElement.dataset.theme = next;
    const toggle = $('#themeToggle');
    if (toggle) {
      toggle.textContent = next === 'dark' ? '☾' : '☀';
      toggle.setAttribute('aria-label', `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`);
    }
  }

  const mobileNavigation = window.matchMedia('(max-width: 900px)');

  function setSidebarOpen(open, restoreFocus = false) {
    const sidebar = $('#sidebar');
    const menu = $('#menuButton');
    sidebar.classList.toggle('open', open);
    sidebar.inert = mobileNavigation.matches && !open;
    $('#sidebarOverlay').classList.toggle('visible', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    $('.topbar').inert = open;
    $('#mainContent').inert = open;
    $('#backToTop').inert = open;
    document.body.classList.toggle('no-scroll', open);
    if (open) ($('.nav-link[aria-current]') || $('.nav-link')).focus();
    else if (restoreFocus) menu.focus();
  }

  function closeSidebar(restoreFocus = false) {
    setSidebarOpen(false, restoreFocus);
  }

  function handleRouteLink(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const hash = link.getAttribute('href');
    if (hash === '#mainContent') {
      $('#mainContent').focus({ preventScroll: true });
      return;
    }
    if (link.closest('#searchResultsPanel')) $('#globalSearch').value = '';
    if (link.matches('[data-back-map]') && history.state?.atlasFromMap) {
      history.back();
      return;
    }
    navigate(hash, link);
  }

  function setupEventListeners() {
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('atlas:statechange', (event) => updateStateViews(event.detail, previousState));
    document.addEventListener('click', handleRouteLink);

    document.addEventListener('change', (event) => {
      const { nodeProgress, nodeStatus, resourceStatus, completionCheck } = event.target.dataset;

      if (nodeProgress) {
        STORE.setNodeState(nodeProgress, { progress: event.target.value });
        toast(`Progress saved · ${DATA.progressLabels[event.target.value]}`);
      } else if (nodeStatus) {
        STORE.setNodeState(nodeStatus, { evidenceStatus: event.target.value });
        toast('Evidence status saved.');
      } else if (completionCheck) {
        const nextProgress = event.target.checked ? 'completed' : 'in-progress';
        STORE.setNodeState(completionCheck, { progress: nextProgress });
        toast(event.target.checked ? 'Capability completed.' : 'Capability marked in progress.');
      } else if (resourceStatus) {
        const lastVerified = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        STORE.setResourceVerification(resourceStatus, { status: event.target.value, lastVerified });
        toast('Resource verification saved.');
      }
    });

    document.addEventListener('input', (event) => {
      const id = event.target.dataset.nodeNote;
      if (id) STORE.setNodeState(id, { note: event.target.value }, false);
    });

    document.addEventListener('click', (event) => {
      const pin = event.target.closest('[data-pin-toggle]');
      if (pin) {
        if (STORE.getWorkingNode() === pin.dataset.pinToggle) {
          STORE.clearWorkingNode();
          toast('Task unpinned.');
        } else {
          STORE.setWorkingNode(pin.dataset.pinToggle);
          toast('Task pinned to Overview.');
        }
      }

      const educationTab = event.target.closest('[data-education-tab]');
      if (educationTab) showEducationPanel(educationTab.dataset.educationTab);
      if (!event.target.closest('.search-shell')) closeSearchPanel();
    });

    $('#educationMobileSelect').addEventListener('change', (event) => showEducationPanel(event.target.value));
    $('#educationSubnav').addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = $$('[data-education-tab]');
      const currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex < 0) return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      let nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      showEducationPanel(tabs[nextIndex].dataset.educationTab);
      tabs[nextIndex].focus();
    });

    $('#mapStatusFilter').addEventListener('change', applyMapFilter);
    for (const filter of ['#resourceStageFilter', '#resourceStatusFilter']) {
      $(filter).addEventListener('change', () => {
        revealedResourceId = null;
        applyResourceFilters();
      });
    }

    $('#globalSearch').addEventListener('input', (event) => performGlobalSearch(event.target.value));
    $('.search-shell').addEventListener('keydown', handleSearchKeys);
    $('#searchResultsClose').addEventListener('click', () => closeSearchPanel(true));

    $('#themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

    $('#menuButton').addEventListener('click', () => setSidebarOpen(true));
    $('#sidebarOverlay').addEventListener('click', () => closeSidebar(true));
    mobileNavigation.addEventListener('change', () => closeSidebar());

    const settingsPanel = $('#settingsPanel');
    $('#openSettingsButton').addEventListener('click', (event) => {
      const invoker = mobileNavigation.matches ? $('#menuButton') : event.currentTarget;
      closeSidebar();
      openSettingsPanel(invoker);
    });
    $('#settingsPanelClose').addEventListener('click', closeSettingsPanel);
    settingsPanel.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeSettingsPanel();
    });
    settingsPanel.addEventListener('click', (event) => {
      if (event.target !== settingsPanel) return;
      const { left, right, top, bottom } = settingsPanel.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) closeSettingsPanel();
    });

    $('#exportButton').addEventListener('click', downloadBackup);
    $('#importButton').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', async (event) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) return;
      try {
        STORE.importPayload(JSON.parse(await file.text()));
        toast('ATLAS backup imported.');
      } catch (error) {
        toast(error.message || 'Could not import this backup.');
      } finally {
        input.value = '';
      }
    });

    $('#resetButton').addEventListener('click', () => {
      $('#resetConfirmation').value = '';
      $('#confirmResetButton').disabled = true;
      $('#resetDialog').showModal();
    });
    $('#resetConfirmation').addEventListener('input', (event) => {
      $('#confirmResetButton').disabled = event.target.value !== 'RESET';
    });
    $('#resetForm').addEventListener('submit', (event) => {
      if (event.submitter?.value === 'cancel') return;
      event.preventDefault();
      if ($('#resetConfirmation').value !== 'RESET') return;
      downloadBackup();
      STORE.reset();
      $('#resetDialog').close();
      toast('ATLAS reset to the approved baseline after exporting a backup.');
    });

    $('#runCheckpointButton').addEventListener('click', () => renderCheckpoint(true));
    $('#backToTop').addEventListener('click', () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
      $(`#${activeRoute.view} h1`)?.focus({ preventScroll: true });
    });
    window.addEventListener('scroll', debounce(() => $('#backToTop').classList.toggle('visible', window.scrollY > 400), 50), { passive: true });

    document.addEventListener('keydown', (event) => {
      if ($('#sidebar').classList.contains('open')) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeSidebar(true);
        } else if (event.key === 'Tab') {
          const controls = $$('#sidebar a, #sidebar button');
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }
      if ($('#settingsPanel').open || $('#resetDialog').open) return;
      const editing = document.activeElement.matches('input, textarea, select, [contenteditable]');
      if ((event.key === '/' && !editing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        $('#globalSearch').focus();
        performGlobalSearch($('#globalSearch').value);
      }
    });
  }

  function initialize() {
    const state = getState();
    setTheme(STORE.getTheme());
    closeSidebar();
    renderHomeReference();
    renderMapStatusFilter();
    renderPhases(state);
    renderProjects(state);
    renderReadiness(state);
    renderProof();
    renderResourceFilters();
    renderResources(state);
    renderGlossary();
    renderEducation();
    renderTrajectory();
    updateStateViews(state);

    history.scrollRestoration = 'manual';
    setupEventListeners();
    applyRoute(location.hash, { initial: true });
  }

  window.ATLAS = {
    data: DATA,
    store: STORE,
    render: renderAll,
    getOverviewModel,
    getCurrentActionModel: getOverviewModel,
    openNode,
    openProject,
    openRole,
    openResource,
    switchView,
    checkpoint: () => renderCheckpoint(true),
    export: STORE.exportPayload
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
