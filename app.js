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

  const saveNodeNote = debounce((id, value) => {
    STORE.setNodeState(id, { note: value }, false);
    toast('Capability note saved locally.');
  }, 350);

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
  const externalLink = (url, label = 'Open resource') => `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} ↗</a>`;
  const listHTML = (items) => items && items.length ? `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : '<p>—</p>';

  const nodeLookup = new Map([
    ...DATA.phases.flatMap((phase) => phase.nodes),
    ...DATA.sweDepth.nodes
  ].map((item) => [item.id, item]));

  const projectLookup = new Map(DATA.projects.map((item) => [item.id, item]));
  const allCapabilityNodes = () => [...DATA.phases.flatMap((phase) => phase.nodes), ...DATA.sweDepth.nodes];
  
  const VALID_PRIMARY_VIEWS = ['home', 'map', 'projects', 'readiness', 'resources', 'education'];
  const VIEW_TITLES = {
    home: 'Overview',
    map: 'Career Map',
    projects: 'Projects',
    readiness: 'Careers',
    resources: 'Learn / Resources',
    education: 'Education & Canada',
    checkpoint: 'Settings & Backup'
  };

  let activePrimaryView = 'home';
  let activeEducationSection = 'overview';
  let isRendering = false;

  function getState() { return STORE.getState(); }

  function toast(message) {
    const region = $('#toastRegion');
    if (!region) return;
    const item = document.createElement('div');
    item.className = 'toast';
    item.textContent = message;
    region.append(item);
    setTimeout(() => item.remove(), 3600);
  }

  function renderStatusBadge(status) {
    return `<span class="status-badge ${statusClass(status)}">${escapeHTML(DATA.statusLabels[status] || status)}</span>`;
  }

  function renderProgressBadge(progress) {
    return `<span class="status-badge ${progressClass(progress)}">${escapeHTML(DATA.progressLabels[progress] || progress)}</span>`;
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

  function resourceSearchText(resource) {
    return [
      resource.id, resource.name, resource.creator, resource.platform, resource.stage, resource.type, resource.purpose,
      resource.summary, resource.why, resource.teaches, resource.howToUse, resource.relevantSections,
      resource.skipSections, resource.doneWhen
    ].join(' ').toLowerCase();
  }

  function capabilityProgress(nodes, state, baselineOnly = false) {
    const usable = nodes.filter((item) => item.evidenceStatus !== DATA.status.OPTIONAL && item.evidenceStatus !== DATA.status.NOT_NEEDED && item.evidenceStatus !== DATA.status.LOCKED);
    const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);
    const achieved = usable.reduce((sum, item) => {
      const progress = baselineOnly ? item.defaultProgress : state.progress[item.id]?.progress || item.defaultProgress;
      const multiplier = progress === 'completed' ? 1 : progress === 'in-progress' ? 0.4 : 0;
      return sum + item.weight * multiplier;
    }, 0);
    return totalWeight ? Math.round((achieved / totalWeight) * 100) : 0;
  }

  function baselineCapabilityCoverage() {
    return capabilityProgress(allCapabilityNodes(), getState(), true);
  }

  function actionCompletionCount(state) {
    const completedCapabilities = allCapabilityNodes().filter((item) => item.defaultProgress !== 'completed' && state.progress[item.id]?.progress === 'completed').length;
    const completedProjects = DATA.projects.filter((item) => item.status !== 'completed' && state.progress[item.id]?.progress === 'completed').length;
    return completedCapabilities + completedProjects;
  }

  // Learner-guided overview model (decoupled from rigid automated mission queues)
  function getOverviewModel(state = getState()) {
    const currentPhase = DATA.phases.find((phase) => phase.name === DATA.currentPosition.stage) || DATA.phases[0];
    const workingNodeId = state.workingNodeId || STORE.getWorkingNode?.();
    const workingNode = workingNodeId ? nodeLookup.get(workingNodeId) : null;

    const effective = (item) => state.progress[item.id] || { progress: item.defaultProgress, evidenceStatus: item.evidenceStatus };
    const allowed = (item) => ![DATA.status.OPTIONAL, DATA.status.NOT_NEEDED, DATA.status.LOCKED].includes(effective(item).evidenceStatus);
    const incomplete = (item) => effective(item).progress !== 'completed';

    const missingNow = currentPhase.nodes.filter((item) => allowed(item) && incomplete(item) && effective(item).evidenceStatus === DATA.status.MISSING);
    const verifyNow = currentPhase.nodes.filter((item) => allowed(item) && incomplete(item) && [DATA.status.LIKELY, DATA.status.PARTIAL].includes(effective(item).evidenceStatus));

    // Core recommended sequence
    const coreSequence = ['testing', 'docker', 'basic-ci'].map((id) => nodeLookup.get(id)).filter(Boolean);

    let queue = [...missingNow, ...verifyNow];
    let missionPhase = currentPhase;
    if (!queue.length) {
      missionPhase = DATA.phases.find((phase) => phase.nodes.some((item) => allowed(item) && incomplete(item))) || currentPhase;
      queue = missionPhase.nodes.filter((item) => allowed(item) && incomplete(item));
    }
    const mission = workingNode || queue[0] || currentPhase.nodes[0];
    const nextTasks = missingNow.length && missionPhase.id === currentPhase.id ? missingNow.slice(1, 4) : queue.slice(1, 4);

    return {
      currentPhase,
      missionPhase,
      mission,
      workingNode,
      coreSequence,
      nextTasks,
      verifyOnce: verifyNow.filter((item) => item.id !== mission.id).slice(0, 3),
      project: DATA.projects.find((item) => item.id === 'project-1'),
      role: DATA.roles.find((item) => item.state === 'apply-now') || DATA.roles[0]
    };
  }

  function getCurrentActionModel(state = getState()) {
    return getOverviewModel(state);
  }

  /* =========================================================================
     PRIMARY VIEW ROUTING & SWITCHING
     ========================================================================= */

  function switchView(viewId, updateHash = true) {
    if (viewId === 'checkpoint') {
      openSettingsPanel();
      return;
    }

    const targetId = VALID_PRIMARY_VIEWS.includes(viewId) ? viewId : 'home';
    activePrimaryView = targetId;

    // Show only the target section
    $$('.view-section').forEach((section) => {
      const isTarget = section.id === targetId;
      section.classList.toggle('active-view', isTarget);
      if (isTarget) {
        section.removeAttribute('aria-hidden');
      } else if (['experience', 'proof', 'glossary', 'opportunities', 'trajectory', 'checkpoint'].includes(section.id)) {
        section.setAttribute('aria-hidden', 'true');
      }
    });

    // Update sidebar navigation active links
    $$('.nav-link').forEach((link) => {
      const isLinkActive = link.getAttribute('href') === `#${targetId}`;
      link.classList.toggle('active', isLinkActive);
      link.setAttribute('aria-current', isLinkActive ? 'page' : 'false');
    });

    // Update Topbar context label
    const labelEl = $('#currentViewLabel');
    if (labelEl) {
      labelEl.textContent = VIEW_TITLES[targetId] || 'Overview';
    }

    // Sync hash if requested
    if (updateHash && window.location.hash !== `#${targetId}`) {
      window.history.pushState(null, '', `#${targetId}`);
    }

    // Scroll to top of the view cleanly
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function handleHashChange() {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash === 'checkpoint') {
      openSettingsPanel();
    } else if (VALID_PRIMARY_VIEWS.includes(hash)) {
      switchView(hash, false);
    } else if (!hash) {
      switchView('home', false);
    }
  }

  /* =========================================================================
     SETTINGS & CHECKPOINT PANEL
     ========================================================================= */

  function openSettingsPanel() {
    $('#settingsPanel')?.removeAttribute('hidden');
    $('#settingsPanelOverlay')?.removeAttribute('hidden');
    document.body.classList.add('no-scroll');
    renderCheckpoint(false);
    $('#settingsPanelClose')?.focus();
  }

  function closeSettingsPanel() {
    $('#settingsPanel')?.setAttribute('hidden', '');
    $('#settingsPanelOverlay')?.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
    $('#openSettingsButton')?.focus();
  }

  /* =========================================================================
     RENDER FUNCTIONS (PRESERVING DATA INVARIANTS & CONTEXT)
     ========================================================================= */

  function renderHome() {
    const state = getState();
    const position = DATA.currentPosition;
    const overview = getOverviewModel(state);
    const versionEl = $('#roadmapVersion');
    if (versionEl) versionEl.textContent = `v${DATA.roadmapVersion}`;

    // 1. Position Panel at top (Compact & Clear)
    const positionPanel = $('#positionPanel');
    if (positionPanel) {
      positionPanel.innerHTML = `
        <div class="position-node">
          <div class="position-node-main">
            <span class="kicker"><span class="status-dot"></span>Current Position</span>
            <h2>${escapeHTML(position.stage)}</h2>
            <p>${escapeHTML(position.identity)}</p>
          </div>
        </div>`;
    }

    // 2. Active Pinned Task Area (ACTION-FIRST)
    const workingContainer = $('#workingTaskContainer');
    if (workingContainer) {
      if (overview.workingNode) {
        const wn = overview.workingNode;
        const wnState = state.progress[wn.id] || { progress: wn.defaultProgress };
        workingContainer.innerHTML = `
          <div class="working-task-card">
            <div class="working-task-badge-row">
              <span class="pinned-indicator">📌 Pinned Working Task</span>
              ${renderProgressBadge(wnState.progress)}
              <button type="button" class="button button-small button-secondary" data-unpin-node="${escapeHTML(wn.id)}">Unpin Task</button>
            </div>
            <h2>${escapeHTML(wn.name)}</h2>
            <p>${escapeHTML(wn.summary)}</p>
            <div class="working-task-actions">
              <button class="button button-primary" type="button" data-open-node="${escapeHTML(wn.id)}">Open Full Recipe &amp; Lab →</button>
            </div>
          </div>`;
      } else {
        workingContainer.innerHTML = `
          <div class="no-working-task-card">
            <div class="no-task-content">
              <span>💡 Tip: Pin a Task</span>
              <p>You can pin any capability from the <strong>Career Map</strong> using the <em>"Work on this"</em> button to keep it front and center here.</p>
            </div>
          </div>`;
      }
    }

    // 3. Focus Mission & Queues
    const missionState = state.progress[overview.mission.id] || overview.mission;
    const focusMissionEl = $('#focusMission');
    if (focusMissionEl) {
      focusMissionEl.innerHTML = `<article class="current-mission-card searchable" data-search="${escapeHTML([overview.mission.name, overview.mission.summary, overview.mission.whyNow, ''].join(' ').toLowerCase())}">
        <div class="mission-head">
          <span class="mission-label">${overview.workingNode ? 'Pinned Focus' : 'Recommended Next'}</span>
          ${renderStatusBadge(missionState.evidenceStatus || overview.mission.evidenceStatus)}
        </div>
        <span class="kicker">${escapeHTML(overview.missionPhase.name)} · Core Capability</span>
        <h2>${escapeHTML(overview.mission.name)}</h2>
        <p>${escapeHTML(overview.mission.summary)}</p>
        <div class="mission-why"><span>Why this is next</span><p>${escapeHTML(overview.mission.whyNow)}</p></div>
        
        <div class="mission-actions">
          <button class="button button-primary" type="button" data-open-node="${escapeHTML(overview.mission.id)}">Open Task Recipe &amp; Lab →</button>
          ${!overview.workingNode || overview.workingNode.id !== overview.mission.id ? `<button class="button button-secondary" type="button" data-pin-node="${escapeHTML(overview.mission.id)}">📌 Work on this</button>` : ''}
        </div>
      </article>`;
    }

    const focusNextEl = $('#focusNextQueue');
    if (focusNextEl) {
      focusNextEl.innerHTML = `<aside class="focus-queue-card">
        <span class="kicker">Core Sequence &amp; Queue</span>
        <h3>Upcoming Dependencies</h3>
        <p>Progress along the Core track at your own pace without calendar pressure.</p>
        <ol>
          ${overview.nextTasks.length ? overview.nextTasks.map((item) => `<li><button type="button" data-open-node="${escapeHTML(item.id)}"><span>${escapeHTML(item.name)}</span></button></li>`).join('') : '<li>Core capabilities established. Explore deeper specializations in the Career Map.</li>'}
        </ol>
      </aside>`;
    }

    // 4. Focus Support Grid
    const focusVerifyEl = $('#focusVerify');
    if (focusVerifyEl) {
      focusVerifyEl.innerHTML = `<article class="focus-support-card"><span class="kicker">Verify Once</span><h3>Claims to check once</h3>${overview.verifyOnce.length ? `<ul>${overview.verifyOnce.map((item) => `<li><button type="button" class="inline-action" data-open-node="${escapeHTML(item.id)}">${escapeHTML(item.name)}</button></li>`).join('')}</ul>` : '<p>No current verify-once items are waiting.</p>'}<p class="support-note">Do not relearn these by default; verify capability once in code.</p></article>`;
    }

    const focusProjectEl = $('#focusProject');
    if (focusProjectEl) {
      focusProjectEl.innerHTML = `<article class="focus-support-card"><span class="kicker">Current Project</span><h3>${escapeHTML(overview.project.name)}</h3><p>${escapeHTML(overview.project.direction)}</p><button type="button" class="inline-action" data-open-project="${escapeHTML(overview.project.id)}">Open Project 1 →</button></article>`;
    }

    const focusRoleEl = $('#focusRole');
    if (focusRoleEl) {
      focusRoleEl.innerHTML = `<article class="focus-support-card"><span class="kicker">Target Role</span><div class="support-title-row"><h3>${escapeHTML(overview.role.name)}</h3><span class="status-badge status-proven">${escapeHTML(overview.role.label)}</span></div><p>${escapeHTML(overview.role.summary)}</p><button type="button" class="inline-action" data-open-role="${escapeHTML(overview.role.id)}">Open Careers &amp; Readiness →</button></article>`;
    }

    // 5. AI-Native Engineering Banner
    const aiBanner = $('#aiNativeBanner');
    if (aiBanner && DATA.aiNativeEngineering) {
      const ai = DATA.aiNativeEngineering;
      aiBanner.innerHTML = `
        <div class="ai-banner-card">
          <div class="ai-banner-head">
            <span class="kicker">Working Principle</span>
            <h3>${escapeHTML(ai.title)}</h3>
          </div>
          <p>${escapeHTML(ai.workingMethod)}</p>
          <div class="ai-floor-block">
            <strong>Mandatory AI-Independent Floor:</strong>
            <ul>
              ${ai.aiIndependentFloor.map((point) => `<li>${escapeHTML(point)}</li>`).join('')}
            </ul>
          </div>
        </div>`;
    }

    // 6. Answer Grid (Progressive Disclosure)
    const cards = [
      ['Where am I?', position.identity, `Primary stage: ${position.stage}.`],
      ['What is proven?', 'Software building + early production work', position.foundation],
      ['What is missing?', 'Production engineering depth', position.mainGap],
      ['What should I ignore?', 'Later tools and artificial quotas', position.ignoreNow]
    ];
    const answerGridEl = $('#answerGrid');
    if (answerGridEl) {
      answerGridEl.innerHTML = cards.map(([label, title, body]) => `
        <article class="answer-card">
          <span class="answer-label">${escapeHTML(label)}</span>
          <strong>${escapeHTML(title)}</strong>
          <p>${escapeHTML(body)}</p>
        </article>`).join('');
    }

    // 7. Baseline Audit (Progressive Disclosure)
    const auditEl = $('#baselineAudit');
    if (auditEl) {
      auditEl.innerHTML = `
        <div class="baseline-audit-head"><div><span class="kicker">Approved current-state calibration</span><h2>Evidence Audit</h2></div><p>Resume claims are not permanent proof. Strong artifacts stay proven; partial skills show only the missing depth.</p></div>
        <div class="audit-grid">${position.evidenceAudit.map((item) => `<article class="audit-item"><div><strong>${escapeHTML(item.name)}</strong><p>${escapeHTML(item.basis)}</p></div>${renderStatusBadge(item.status)}</article>`).join('')}</div>`;
    }

    // 8. Migration Notice
    const notice = $('#migrationNotice');
    if (notice) {
      if (state.migration?.from === 'legacy-checkbox-roadmap' || state.legacyBackup) {
        const backup = state.legacyBackup;
        notice.hidden = false;
        notice.innerHTML = `<strong>Legacy progress protected.</strong> ${backup ? `${backup.completedTaskCount} completed items across ${backup.taskCount} old task records were preserved` : 'Old state was preserved'} in the v2 backup payload.`;
      } else {
        notice.hidden = true;
      }
    }
  }

  function renderArchitecture() {
    const archStrip = $('#architectureStrip');
    const currentStage = DATA.currentPosition.stage;
    if (archStrip) {
      archStrip.innerHTML = DATA.architecture.map((step, index) => {
        const isCurrent = step === currentStage || (index === 0 && !DATA.architecture.includes(currentStage));
        return `
          <div class="architecture-step ${isCurrent ? 'architecture-step-current' : ''}">
            <span>${isCurrent ? '● ACTIVE' : `STAGE ${index + 1}`}</span>
            <strong>${escapeHTML(step)}</strong>
          </div>`;
      }).join('');
    }

    const sweTrack = $('#sweDepthTrack');
    if (sweTrack) {
      sweTrack.innerHTML = `
        <details class="parallel-track-details">
          <summary><div><span class="kicker">Parallel depth · not the next phase</span><h3>${escapeHTML(DATA.sweDepth.name)}</h3><p>${escapeHTML(DATA.sweDepth.summary)}</p></div><span class="parallel-track-action">Explore parallel track <span class="chevron">›</span></span></summary>
          <div class="parallel-track-body">
            <div class="parallel-explainer"><strong>How to use this track</strong><p>Develop these capabilities alongside later phases when the active project needs them. They run in parallel with the Core phases.</p></div>
            <div class="track-tags">${DATA.sweDepth.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}</div>
            <div class="node-grid">${DATA.sweDepth.nodes.map((item) => renderNode(item, DATA.sweDepth)).join('')}</div>
          </div>
        </details>`;
    }
  }

  function taskResourceUsage(item, resource) {
    const explicit = DATA.taskResourceContext?.[item.id]?.[resource.id];
    if (explicit) return explicit;
    return {
      role: resource.type,
      why: `Use this resource only for the parts of ${item.name} that the active project or diagnostic has not already proved.`,
      selected: resource.relevantSections || resource.teaches,
      repeat: `Return when ${item.name} exposes a concrete implementation or reasoning question.`,
      stop: resource.doneWhen
    };
  }

  function renderTaskResource(item, resource) {
    const usage = taskResourceUsage(item, resource);
    return `<article class="task-resource-card">
      <div class="task-resource-head"><div><span>${escapeHTML(resource.id)}</span><strong>${escapeHTML(resource.name)}</strong></div>${renderResourceTypeBadge(resource)}</div>
      <dl class="task-resource-context">
        <div><dt>Role here</dt><dd>${escapeHTML(usage.role)}</dd></div>
        <div><dt>Why selected</dt><dd>${escapeHTML(usage.why)}</dd></div>
        <div><dt>Use these parts</dt><dd>${escapeHTML(usage.selected)}</dd></div>
        <div><dt>Return when</dt><dd>${escapeHTML(usage.repeat)}</dd></div>
        <div><dt>Stop when</dt><dd>${escapeHTML(usage.stop)}</dd></div>
      </dl>
      ${externalLink(resource.url, 'Open resource')}
    </article>`;
  }

  function renderNode(item, parentTrack = null) {
    const state = getState();
    const nodeState = state.progress[item.id] || { progress: item.defaultProgress, evidenceStatus: item.evidenceStatus, note: '' };
    const resources = (item.resourceIds || []).map((id) => DATA.resources.find((resource) => resource.id === id)).filter(Boolean);
    const video = DATA.orientationVideos?.find((record) => record.nodeIds.includes(item.id));
    const ytCourse = DATA.youtubeLearning?.find((record) => record.nodeIds.includes(item.id));
    const teaching = item.teaches?.length ? item.teaches : item.cover;
    const currentPhaseOrder = DATA.phases.find((phase) => phase.name === DATA.currentPosition.stage)?.order || 1;
    const laterPhase = parentTrack?.order && parentTrack.order > currentPhaseOrder;
    const deliberatelyLater = [DATA.status.LOCKED, DATA.status.NOT_NEEDED, DATA.status.OPTIONAL].includes(nodeState.evidenceStatus) || laterPhase;
    const isPinned = state.workingNodeId === item.id;

    const prerequisiteContent = item.prerequisites.length
      ? listHTML(item.prerequisites)
      : `<p>${escapeHTML(parentTrack?.prerequisites || 'Use the active project and the preceding dependency as context; no separate prerequisite course is required.')}</p>`;

    const lab = item.handsOnLab;
    const completionCheck = item.completionCheck || item.proof || 'Completion check has not been configured for this capability.';
    const explainIt = item.explainIt || `Explain the core concepts, failure modes, and architectural trade-offs of ${item.name} to another engineer without reading code verbatim.`;

    const searchText = [
      item.name, item.summary, item.whatIsThis, item.why, item.whyNow, item.careerConnection, '', item.miniExercise, item.projectApplication, item.unlocks,
      ...teaching, ...item.cover, ...item.skip, item.proof, completionCheck, explainIt, ...item.prerequisites, ...item.evidenceBasis,
      video?.title, video?.creator, ytCourse?.title, ytCourse?.creator, ...resources.map(resourceSearchText)
    ].join(' ').toLowerCase();

    return `
      <details class="node-card searchable ${isPinned ? 'node-card-pinned' : ''}" data-node-id="${escapeHTML(item.id)}" data-evidence-status="${escapeHTML(nodeState.evidenceStatus)}" data-search="${escapeHTML(searchText)}">
        <summary class="node-summary">
          <div>
            <div class="node-title-row">
              <h4>${isPinned ? '<span class="pin-badge">📌</span> ' : ''}${escapeHTML(item.name)}</h4>
              ${renderStatusBadge(nodeState.evidenceStatus)}
            </div>
            <p class="node-subtitle">${escapeHTML(item.summary)}</p>
          </div>
          ${renderProgressBadge(nodeState.progress)}
          <span class="chevron">›</span>
        </summary>
        <div class="node-body">
          ${deliberatelyLater ? `<div class="why-not-yet"><span>Why not yet?</span><p>${escapeHTML(laterPhase ? `${parentTrack.name} follows the current ${DATA.currentPosition.stage} dependency. Use it for orientation now, then act when the preceding phase evidence is strong enough.` : `${item.name} is deliberately ${DATA.statusLabels[nodeState.evidenceStatus].toLowerCase()}. It should not displace the active dependency or create artificial urgency.`)}</p></div>` : ''}

          <section class="task-recipe" aria-label="${escapeHTML(item.name)} task recipe">
            <!-- 1. WHAT IS THIS? -->
            <div class="recipe-block recipe-overview"><span>What is this?</span><p>${escapeHTML(item.whatIsThis)}</p></div>

            <!-- 2. WHY DOES THIS MATTER? -->
            <div class="recipe-block"><span>Why does this matter?</span><p>${escapeHTML(item.why)}</p></div>

            <!-- 3. WHERE DOES THIS FIT / WHY NOW? -->
            <div class="recipe-block"><span>Where does this fit? (Why now)</span><p>${escapeHTML(item.whyNow)}</p></div>

            <!-- 4. PREREQUISITES -->
            <div class="recipe-block"><span>Prerequisites</span>${prerequisiteContent}</div>

            <!-- 5. WATCH FIRST (ORIENTATION VIDEO) -->
            <div class="recipe-block recipe-video">
              <span>Watch first · Beginner orientation</span>
              ${video ? `
                <div class="video-orientation-head">
                  <div><strong>${escapeHTML(video.title)}</strong><p>${escapeHTML(video.creator)} · ${escapeHTML(video.duration)} · verified ${escapeHTML(video.lastVerified)}</p></div>
                  <span class="video-status verified">Verified orientation</span>
                </div>
                <p><b>Why this video:</b> ${escapeHTML(video.why)}</p>
                <p><b>Understand afterward:</b> ${escapeHTML(video.understandAfter)}</p>
                ${externalLink(video.url, 'Watch on YouTube')}
              ` : `
                <div class="video-missing">
                  <strong>NEEDS VIDEO VERIFICATION</strong>
                  <p>No standalone short orientation video has passed ATLAS verification for this node yet. Use the free YouTube course or written resources below.</p>
                </div>
              `}
            </div>

            <!-- 6. LEARN FREE ON YOUTUBE -->
            ${ytCourse ? `
              <div class="recipe-block recipe-yt-course">
                <span>Learn Free on YouTube · Verified Course</span>
                <div class="yt-course-card">
                  <div class="yt-course-head">
                    <div>
                      <strong>${escapeHTML(ytCourse.title)}</strong>
                      <p>${escapeHTML(ytCourse.creator)} · ${escapeHTML(ytCourse.duration)} · ${escapeHTML(ytCourse.level)}</p>
                    </div>
                    <span class="video-status ${ytCourse.status === 'VERIFIED' ? 'verified' : 'unverified'}">${escapeHTML(ytCourse.status)}</span>
                  </div>
                  <p><b>Why selected:</b> ${escapeHTML(ytCourse.whySelected)}</p>
                  <p><b>Selected chapters:</b> ${escapeHTML(ytCourse.nodeSelections?.[item.id] || ytCourse.selectedSections)}</p>
                  ${ytCourse.skip ? `<p><b>Skip:</b> ${escapeHTML(ytCourse.skip)}</p>` : ''}
                  <p><b>Done when:</b> ${escapeHTML(ytCourse.doneWhen)}</p>
                  ${externalLink(ytCourse.url, 'Open YouTube Course')}
                </div>
              </div>
            ` : ''}

            <!-- 7. OFFICIAL & REFERENCE RESOURCES -->
            <div class="recipe-block recipe-resources">
              <span>Official &amp; Reference Resources</span>
              ${resources.length ? `<div class="task-resource-list">${resources.map((resource) => renderTaskResource(item, resource)).join('')}</div>` : '<p>Use the active project and a small diagnostic. Add a reference only when a concrete gap appears.</p>'}
            </div>

            <!-- 8. BUILD THIS (HANDS-ON LAB) -->
            ${lab ? `
              <div class="recipe-block recipe-lab">
                <span>Build this · Hands-On Lab</span>
                <div class="lab-card">
                  <h4>${escapeHTML(lab.title)}</h4>
                  <p class="lab-goal"><b>Goal:</b> ${escapeHTML(lab.goal)}</p>
                  <div class="lab-steps">
                    <strong>Step-by-step Execution:</strong>
                    <ol>
                      ${lab.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join('')}
                    </ol>
                  </div>
                  <div class="lab-outcome">
                    <strong>Expected Result:</strong>
                    <p>${escapeHTML(lab.expectedResult)}</p>
                  </div>
                  ${lab.stretch ? `
                    <div class="lab-stretch">
                      <strong>Stretch Challenge:</strong>
                      <p>${escapeHTML(lab.stretch)}</p>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : `
              <div class="recipe-block recipe-first">
                <span>First Action</span>
                <p>${escapeHTML('')}</p>
                ${item.miniExercise ? `<p><b>Mini exercise:</b> ${escapeHTML(item.miniExercise)}</p>` : ''}
              </div>
            `}

            <!-- 9. EXPLAIN IT -->
            <div class="recipe-block recipe-explain">
              <span>Explain it · Technical Articulation</span>
              <p>${escapeHTML(explainIt)}</p>
            </div>

            <!-- 10. WHAT TO SKIP -->
            ${item.skip.length ? `
              <div class="recipe-block recipe-skip">
                <span>What to skip for now</span>
                ${listHTML(item.skip)}
              </div>
            ` : ''}

            <!-- 11. COMPLETION CHECK (SELF-ASSESSMENT) -->
            <div class="recipe-block recipe-done">
              <span>Completion Check · Self-Assessment</span>
              <div class="completion-check-box">
                <label class="completion-checkbox-label">
                  <input type="checkbox" data-completion-check="${escapeHTML(item.id)}" ${nodeState.progress === 'completed' ? 'checked' : ''}>
                  <span>${escapeHTML(completionCheck)}</span>
                </label>
              </div>
            </div>

            <!-- 12. WHAT THIS UNLOCKS -->
            <div class="recipe-block">
              <span>What this unlocks</span>
              <p>${escapeHTML(item.unlocks)}</p>
            </div>
          </section>

          <!-- Node Controls -->
          <div class="node-controls">
            <label>Progress
              <select data-node-progress="${escapeHTML(item.id)}">
                ${Object.entries(DATA.progressLabels).map(([value, label]) => `<option value="${value}" ${nodeState.progress === value ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('')}
              </select>
            </label>
            <label>Evidence status
              <select data-node-status="${escapeHTML(item.id)}">
                ${Object.entries(DATA.statusLabels).map(([value, label]) => `<option value="${value}" ${nodeState.evidenceStatus === value ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('')}
              </select>
            </label>
            <button class="button ${isPinned ? 'button-secondary' : 'button-primary'} button-small" type="button" data-pin-toggle="${escapeHTML(item.id)}">
              ${isPinned ? '📌 Unpin Task' : '📌 Work on this'}
            </button>
          </div>
          <label class="node-note">Notes &amp; Architecture Insights
            <textarea data-node-note="${escapeHTML(item.id)}" maxlength="2000" placeholder="Record implementation decisions, edge cases, or reflections…">${escapeHTML(nodeState.note || '')}</textarea>
          </label>
        </div>
      </details>`;
  }

  function renderPhases() {
    const state = getState();
    const phaseListEl = $('#phaseList');
    if (!phaseListEl) return;

    phaseListEl.innerHTML = DATA.phases.map((phase, index) => {
      const progress = capabilityProgress(phase.nodes, state);
      const counts = phase.nodes.reduce((summary, item) => {
        const status = state.progress[item.id]?.evidenceStatus || item.evidenceStatus;
        if (status === DATA.status.PROVEN) summary.proven += 1;
        else if (status === DATA.status.LIKELY) summary.verify += 1;
        else if (status === DATA.status.PARTIAL) summary.partial += 1;
        else if (status === DATA.status.MISSING) summary.missing += 1;
        else summary.later += 1;
        return summary;
      }, { proven: 0, verify: 0, partial: 0, missing: 0, later: 0 });

      const evidenceSummary = [`${counts.proven} proven`, `${counts.verify} verify once`, `${counts.partial} partial`, `${counts.missing} missing`, counts.later ? `${counts.later} later` : ''].filter(Boolean).join(' · ');

      return `
        <details class="phase-card" data-phase-id="${escapeHTML(phase.id)}" ${index === 0 ? 'open' : ''}>
          <summary class="phase-summary">
            <span class="phase-number">${String(phase.order).padStart(2, '0')}</span>
            <div class="phase-copy"><h3>${escapeHTML(phase.name)}</h3><p>${escapeHTML(phase.summary)}</p></div>
            <div class="phase-progress"><strong>${escapeHTML(evidenceSummary)}</strong><span>${progress}% coverage</span></div>
            <span class="chevron">›</span>
          </summary>
          <div class="phase-body">
            <div class="phase-meta">
              <div class="meta-card"><span>Why this phase exists</span><p>${escapeHTML(phase.why)}</p></div>
              <div class="meta-card"><span>Prerequisite</span><p>${escapeHTML(phase.prerequisites)}</p></div>
              <div class="meta-card"><span>Project milestone</span><p>${escapeHTML(phase.proof)}</p></div>
            </div>
            <div class="node-grid">${phase.nodes.map((item) => renderNode(item, phase)).join('')}</div>
            <div class="meta-card" style="margin-top:14px"><span>What this unlocks</span><p>${escapeHTML(phase.unlocks)}</p></div>
          </div>
        </details>`;
    }).join('');
  }

  function renderProjects() {
    const state = getState();
    const projectLadderEl = $('#projectLadder');
    if (!projectLadderEl) return;

    projectLadderEl.innerHTML = DATA.projects.map((project, index) => {
      const projectState = state.progress[project.id] || { progress: project.status };
      const resources = (project.resourceIds || []).map((id) => DATA.resources.find((resource) => resource.id === id)).filter(Boolean);
      const searchText = [
        project.name, project.purpose, project.direction, project.domainBadge, project.recommendedBuild, project.whyThisProblem,
        ...project.mustProve, ...project.guardrails, project.proof, ...resources.map(resourceSearchText)
      ].join(' ').toLowerCase();

      // Clean, intentional project numbering P01, P02, P03...
      const projectIndexLabel = `P${String(index + 1).padStart(2, '0')}`;

      return `
        <details class="project-card searchable" data-project-id="${escapeHTML(project.id)}" data-search="${escapeHTML(searchText)}" ${index === 0 ? 'open' : ''}>
          <summary class="project-summary">
            <span class="project-index">${projectIndexLabel}</span>
            <div>
              <div class="project-title-row">
                <h3>${escapeHTML(project.name)}</h3>
                ${project.domainBadge ? `<span class="domain-badge">${escapeHTML(project.domainBadge)}</span>` : ''}
              </div>
              <p>${escapeHTML(project.purpose)}</p>
            </div>
            ${renderProgressBadge(projectState.progress)}
            <span class="chevron">›</span>
          </summary>
          <div class="project-body">
            <div class="project-guide-grid">
              <div class="project-column">
                <h4>Direction &amp; Candidate</h4>
                <p>${escapeHTML(project.direction)}</p>
                ${project.optionalGreenfield ? `<div class="greenfield-callout"><strong>Optional Greenfield:</strong> <p>${escapeHTML(project.optionalGreenfield)}</p></div>` : ''}
                ${project.recommendedBuild ? `<div class="recommended-build-box"><strong>Recommended Build:</strong> <p>${escapeHTML(project.recommendedBuild)}</p></div>` : ''}
                ${resources.length ? `
                  <div class="project-resources">
                    <span>Targeted References</span>
                    ${resources.map((resource) => `<a href="${escapeHTML(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(resource.id)} · ${escapeHTML(resource.name)}</a>`).join('')}
                  </div>` : ''}
                <label class="eyebrow" style="margin-top: 14px; display: block;">Milestone State
                  <select data-node-progress="${escapeHTML(project.id)}" style="display:block;margin-top:6px;width:100%">
                    ${Object.entries(DATA.progressLabels).map(([value, label]) => `<option value="${value}" ${projectState.progress === value ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('')}
                  </select>
                </label>
              </div>

              <div class="project-column">
                <h4>Problem &amp; Value</h4>
                <p><b>Why this problem:</b> ${escapeHTML(project.whyThisProblem || project.purpose)}</p>
                <p><b>Who it helps:</b> ${escapeHTML(project.whoItHelps || 'Engineers and end users needing reliable software.')}</p>
                <p><b>MVP Scope:</b> ${escapeHTML(project.mvp || project.mustProve[0])}</p>
                ${project.technicalChallenges ? `<div><b>Key Technical Challenges:</b>${listHTML(project.technicalChallenges)}</div>` : ''}
              </div>

              <div class="project-column">
                <h4>Must Prove &amp; Guardrails</h4>
                <div><b>Must Prove:</b>${listHTML(project.mustProve)}</div>
                ${project.whatNotToOverbuild ? `<div class="overbuild-warning"><b>What NOT to Overbuild:</b> <p>${escapeHTML(project.whatNotToOverbuild)}</p></div>` : ''}
              </div>
            </div>

            <div class="project-proof">
              <strong>Completion Check / Standard:</strong>
              <p>${escapeHTML(project.completionCheck || project.proof)}</p>
            </div>
          </div>
        </details>`;
    }).join('');
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

  function renderReadiness() {
    const state = getState();
    const stateClasses = { 'apply-now': 'status-proven', 'apply-selectively': 'status-likely', 'prepare-first': 'status-partial', 'not-yet': 'status-not-needed' };
    const platformById = new Map(DATA.discoveryStack.map((item) => [item.id, item]));
    const roleSearchUrl = (platform, query) => platform.searchPattern
      ? platform.searchPattern.replace('{query}', encodeURIComponent(query))
      : platform.url;

    const readinessGridEl = $('#readinessGrid');
    if (readinessGridEl) {
      readinessGridEl.innerHTML = DATA.roles.map((role, index) => {
        const dynamic = calculateRoleReadiness(role, state);
        const project = projectLookup.get(role.projectId);
        const platforms = role.platformIds.map((id) => platformById.get(id)).filter(Boolean);
        const searchText = [
          role.name, dynamic.label, role.whatItDoes, dynamic.reason, role.summary,
          ...role.searchTitles, ...role.have, ...role.requirements, ...role.develop, ...role.resume, ...role.skipWhen
        ].join(' ').toLowerCase();

        return `<details class="readiness-card searchable" data-role-id="${escapeHTML(role.id)}" data-search="${escapeHTML(searchText)}" ${index === 0 ? 'open' : ''}>
          <summary class="readiness-head">
            <div>
              <span class="kicker">Role Path</span>
              <h3>${escapeHTML(role.name)}</h3>
              <p>${escapeHTML(role.whatItDoes)}</p>
            </div>
            <span class="status-badge ${stateClasses[dynamic.state] || 'status-not-needed'}">${escapeHTML(dynamic.label)}</span>
            <span class="chevron">›</span>
          </summary>
          <div class="role-launch-body">
            <div class="role-why">
              <span>Why this status?</span>
              <p><strong>${escapeHTML(dynamic.label)}:</strong> ${escapeHTML(dynamic.reason)}</p>
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
              ${project ? `<button type="button" class="inline-action" data-open-project="${escapeHTML(project.id)}">Open project evidence →</button>` : ''}
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
                <h3>${escapeHTML(item.name)}</h3>
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
    const statuses = ['current', 'still-good', 'needs-review', 'unavailable', 'locked'];
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

  function renderResources() {
    const state = getState();
    const stage = $('#resourceStageFilter')?.value || 'all';
    const status = $('#resourceStatusFilter')?.value || 'all';

    // Render YouTube Courses
    const ytGrid = $('#youtubeCourseGrid');
    if (ytGrid && DATA.youtubeLearning) {
      ytGrid.innerHTML = DATA.youtubeLearning.map((course) => `
        <article class="youtube-course-card searchable" data-yt-id="${escapeHTML(course.id)}" data-search="${escapeHTML([course.title, course.creator, course.whySelected].join(' ').toLowerCase())}">
          <div class="yt-badge-row">
            <span class="yt-type-pill">${escapeHTML(course.type)}</span>
            <span class="video-status ${course.status === 'VERIFIED' ? 'verified' : 'unverified'}">${escapeHTML(course.status)}</span>
          </div>
          <h4>${escapeHTML(course.title)}</h4>
          <span class="yt-creator">${escapeHTML(course.creator)} · ${escapeHTML(course.duration)} · ${escapeHTML(course.level)}</span>
          <p class="yt-why">${escapeHTML(course.whySelected)}</p>
          <div class="yt-chapters">
            <strong>Selected Chapters:</strong>
            <p>${escapeHTML(course.selectedSections)}</p>
          </div>
          ${course.skip ? `<p class="yt-skip"><b>Skip:</b> ${escapeHTML(course.skip)}</p>` : ''}
          <div class="yt-footer">
            <span>Done when: ${escapeHTML(course.doneWhen)}</span>
            ${externalLink(course.url, 'Watch on YouTube')}
          </div>
        </article>
      `).join('');
    }

    // Render Official Resources
    const matching = DATA.resources.filter((resource) => {
      const verification = state.resourceVerification[resource.id] || resource;
      return (stage === 'all' || resource.stage === stage) && (status === 'all' || verification.status === status);
    });

    const resGrid = $('#resourceGrid');
    if (resGrid) {
      resGrid.innerHTML = matching.map((resource) => {
        const verification = state.resourceVerification[resource.id] || resource;
        const badgeStatus = verification.status === 'locked' ? 'status-locked' : verification.status === 'current' ? 'status-proven' : 'status-likely';
        return `<article class="resource-card searchable" id="resource-${escapeHTML(resource.id)}" data-resource-id="${escapeHTML(resource.id)}" data-search="${escapeHTML(resourceSearchText(resource))}">
          <div class="resource-meta"><span class="resource-id">${escapeHTML(resource.id)} · ${escapeHTML(resource.stage.replaceAll('-', ' '))}</span><span class="status-badge ${badgeStatus}">${escapeHTML(verification.status.replaceAll('-', ' '))}</span></div>
          <div class="resource-type-row">${renderResourceTypeBadge(resource)}</div>
          <h3>${escapeHTML(resource.name)}</h3><span class="resource-creator">${escapeHTML(resource.creator)} · ${escapeHTML(resource.platform)}</span>
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
          <div class="resource-footer"><span class="resource-verified">Registry checked ${escapeHTML(resource.lastVerified)}${verification.lastVerified !== resource.lastVerified ? `<small>Your check: ${escapeHTML(verification.lastVerified)}</small>` : ''}</span>${externalLink(resource.url)}</div>
          <div class="resource-verification"><label>Verification state<select data-resource-status="${escapeHTML(resource.id)}">${['current', 'still-good', 'needs-review', 'unavailable', 'locked'].map((value) => `<option value="${value}" ${verification.status === value ? 'selected' : ''}>${escapeHTML(value.replaceAll('-', ' '))}</option>`).join('')}</select></label></div>
        </article>`;
      }).join('');
    }
    const emptyEl = $('#resourceEmpty');
    if (emptyEl) emptyEl.hidden = matching.length > 0;
  }

  function renderGlossary() {
    const glossGrid = $('#glossaryGrid');
    if (glossGrid) {
      glossGrid.innerHTML = DATA.glossary.map((item) => `<article class="glossary-card searchable" data-search="${escapeHTML(`${item.term} ${item.definition}`.toLowerCase())}"><h3>${escapeHTML(item.term)}</h3><p>${escapeHTML(item.definition)}</p></article>`).join('');
    }
  }

  const educationSearchText = (...values) => JSON.stringify(values).toLowerCase();
  const educationSearchAttrs = (...values) => `class="education-card searchable" data-search="${escapeHTML(educationSearchText(...values))}"`;
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
    return `<details class="policy-card searchable ${isSuperseded ? 'policy-card-superseded' : ''}" data-search="${escapeHTML(educationSearchText(policy))}">
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
    return `<details class="program-card searchable" data-search="${escapeHTML(educationSearchText(program))}">
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
        <article ${educationSearchAttrs(horizon)}><div class="education-horizon"><div><span class="kicker">${escapeHTML(horizon.label)}</span><strong>${escapeHTML(horizon.value)}</strong></div><span class="policy-badge verification-reverify-soon">${escapeHTML(horizon.status)}</span></div><p>${escapeHTML(horizon.reference)}</p><p><strong>${escapeHTML(horizon.objective)}</strong></p><div class="strategy-guardrail">${escapeHTML(horizon.meaning)}</div></article>
        <div class="education-map-grid">${education.hierarchy.map((map) => `<article ${educationSearchAttrs(map)}><span class="kicker">${escapeHTML(map.label)} · ${escapeHTML(map.role)}</span><h3>${escapeHTML(map.name)}</h3><p>${escapeHTML(map.summary)}</p></article>`).join('')}</div>
        <article ${educationSearchAttrs(education.valueBuilding)}><span class="kicker">Career independence</span><h3>${escapeHTML(education.valueBuilding.title)}</h3><p>${escapeHTML(education.valueBuilding.summary)}</p><div class="tag-list">${education.valueBuilding.assets.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><div class="strategy-guardrail"><strong>${escapeHTML(education.valueBuilding.experienceLabel)}</strong> ${escapeHTML(education.valueBuilding.guardrail)}</div></article>
        <div class="education-section-intro"><div><span class="kicker">Current verified snapshot · ${escapeHTML(snapshot.referenceDate)}</span><h3>Canada policy reference</h3><p>${escapeHTML(snapshot.note)}</p></div><span class="policy-badge verification-current">${escapeHTML(snapshot.status)}</span></div>
        <div class="policy-grid">${snapshot.records.map(renderPolicyCard).join('')}</div>`],
      ['education-strategy', `
        <div class="education-two-column"><article ${educationSearchAttrs(education.metadata)}><span class="kicker">Current education position</span><h3>Bachelor’s progression</h3>${renderMetadataRows(education.metadata)}</article><article ${educationSearchAttrs(education.mastersDecision)}><span class="kicker">Master’s decision system</span><h3>Compare the exact route, not a university label</h3><p>${escapeHTML(education.mastersDecision.principle)}</p><div class="tag-list">${education.mastersDecision.routes.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div>${listHTML(education.mastersDecision.guardrails)}</article></div>
        <article ${educationSearchAttrs(education.mastersDecision.preparation)}><span class="kicker">Admission preparation</span><h3>Evidence to refresh when applications become real</h3>${listHTML(education.mastersDecision.preparation)}</article>
        <article ${educationSearchAttrs(education.valueBuilding.experienceFlow)}><span class="kicker">Professional experience · ${escapeHTML(education.valueBuilding.experienceLabel)}</span><h3>Arrive with professional value when opportunity allows</h3><div class="experience-flow">${education.valueBuilding.experienceFlow.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><p>${escapeHTML(education.valueBuilding.guardrail)}</p></article>`],
      ['university-options', `
        <div class="education-section-intro"><div><span class="kicker">${escapeHTML(education.universitySnapshot.title)}</span><h3>Five strategic comparisons</h3><p>${escapeHTML(education.universitySnapshot.rule)}</p></div><span class="policy-badge verification-reverify-soon">${escapeHTML(education.universitySnapshot.status)}</span></div>
        <div class="program-grid">${education.universitySnapshot.programs.map(renderProgramCard).join('')}</div>`],
      ['lakehead-alternatives', `
        <article ${educationSearchAttrs(education.lakehead)}><span class="kicker">${escapeHTML(education.lakehead.classification)}</span><h3>Lakehead is a legitimate option—not an automatic recommendation</h3><p>${escapeHTML(education.lakehead.decisionRule)}</p><div class="route-comparison">${education.lakehead.routeTradeoff.map((route) => `<div><strong>${escapeHTML(route.route)}</strong><span>${escapeHTML(route.value)}</span><p>${escapeHTML(route.constraint)}</p></div>`).join('')}</div></article>
        <div class="campus-grid">${education.lakehead.campuses.map((campus) => `<article ${educationSearchAttrs(campus)}><div class="campus-head"><div><span class="kicker">Campus-specific identity</span><h3>${escapeHTML(campus.campus)}</h3></div><span class="policy-badge ${campus.dliCampusMatch === 'VERIFIED' ? 'verification-current' : 'verification-unknown'}">DLI match: ${escapeHTML(campus.dliCampusMatch)}</span></div>${renderMetadataRows([['Program availability', campus.programAvailability], ['DLI number', campus.dliNumber], ['PGWP / immigration by campus', campus.pgwpByCampus], ['Campus route availability', campus.campusRouteAvailability], ['Last verified', campus.lastVerified]])}${campus.action ? `<div class="policy-alert"><strong>Action before reliance</strong><p>${escapeHTML(campus.action)}</p></div>` : ''}<div class="policy-source">${externalLink(campus.officialCampusSource.url, campus.officialCampusSource.name)}</div></article>`).join('')}</div>
        <article ${educationSearchAttrs(lakeheadProgram.tradeoffs)}><span class="kicker">Decision dimensions remain separate</span><h3>Career value ≠ immigration value ≠ personal / life value</h3><div class="tag-list">${education.valueDimensions.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><p>No single combined score decides Lakehead or any alternative.</p></article>`],
      ['location-analysis', `
        <article ${educationSearchAttrs(education.locationAnalysis)}><span class="kicker">Location decision · separate from university decision</span><h3>${escapeHTML(education.locationAnalysis.location)} ≠ ${escapeHTML(education.locationAnalysis.distinctFrom)}</h3><div class="status-callout"><strong>${escapeHTML(education.locationAnalysis.status)}</strong><p>${escapeHTML(education.locationAnalysis.question)}</p></div><div class="research-grid">${education.locationAnalysis.research.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div></article>`],
      ['language-strategy', `
        <div class="language-grid">${education.languageStrategy.map((item) => `<article ${educationSearchAttrs(item)}><span class="kicker">Language purpose</span><h3>${escapeHTML(item.purpose)}</h3><p>${escapeHTML(item.summary)}</p>${listHTML(item.questions)}<div class="strategy-guardrail"><strong>Revalidate</strong> ${escapeHTML(item.revalidate)}</div></article>`).join('')}</div>
        <article ${educationSearchAttrs(education.languageStrategy)}><span class="kicker">Permanent distinction</span><h3>Admission language ≠ PGWP language ≠ immigration language</h3><p>ATLAS does not create one generic IELTS node. The accepted test, score, validity, timing and purpose must be verified independently.</p></article>`],
      ['financial-planning', `
        <div class="education-two-column"><article ${educationSearchAttrs(education.finances.published)}><span class="kicker">${escapeHTML(education.finances.published.status)}</span><h3>${escapeHTML(education.finances.published.title)}</h3>${listHTML(education.finances.published.items)}<p class="small-note">Last verified ${escapeHTML(education.finances.published.lastVerified)}</p></article><article ${educationSearchAttrs(education.finances.future)}><span class="kicker">${escapeHTML(education.finances.future.status)}</span><h3>${escapeHTML(education.finances.future.title)}</h3>${listHTML(education.finances.future.items)}</article></div>
        <article ${educationSearchAttrs(education.finances.studyPermitReference)}><span class="kicker">Study-permit reference ≠ living-cost estimate</span><h3>Keep financial meanings separate</h3><p>${escapeHTML(education.finances.studyPermitReference)}</p><div class="strategy-guardrail">${escapeHTML(education.finances.guardrail)}</div></article>
        <article ${educationSearchAttrs(education.finances.horizon)}><span class="kicker">${escapeHTML(education.finances.horizon.title)}</span><h3>${escapeHTML(education.finances.horizon.status)}</h3><p>${escapeHTML(education.finances.horizon.trigger)}</p><div class="tag-list">${education.finances.resourceClasses.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div></article>`],
      ['canada-requirements', `
        <article ${educationSearchAttrs(education.canadaRequirements)}><span class="kicker">Exact-program rule</span><h3>Eligibility is never inherited from a university name</h3><p>${escapeHTML(education.canadaRequirements.programIdentityRule)}</p><div class="strategy-guardrail"><strong>PGWP revalidation required</strong> before accepting an offer or paying a substantial deposit.</div></article>
        <article ${educationSearchAttrs(education.canadaRequirements.beforeCommitment)}><span class="kicker">Decision checklist</span><h3>Before committing significant money</h3>${listHTML(education.canadaRequirements.beforeCommitment)}</article>
        <div class="education-two-column"><article ${educationSearchAttrs(education.canadaRequirements.workEvidenceRule)}><span class="kicker">Work evidence</span><h3>Two different questions</h3><p><strong>Career:</strong> does this make me a stronger engineer?</p><p><strong>Immigration:</strong> does this exact experience qualify under the pathway being evaluated?</p><p>${escapeHTML(education.canadaRequirements.workEvidenceRule)}</p></article><article ${educationSearchAttrs(education.canadaRequirements.remoteWorkRule)}><span class="kicker">Remote work</span><h3>Career opportunity, not assumed funding</h3><p>${escapeHTML(education.canadaRequirements.remoteWorkRule)}</p></article></div>`],
      ['immigration-reference', `
        <article ${educationSearchAttrs(education.immigrationReference)}><div class="education-section-intro"><div><span class="kicker">Strategic reference</span><h3>${escapeHTML(education.immigrationReference.title)}</h3></div><span class="policy-badge verification-reverify-soon">${escapeHTML(education.immigrationReference.status)}</span></div><p>${escapeHTML(education.immigrationReference.summary)}</p><div class="tag-list">${education.immigrationReference.categories.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div><div class="strategy-guardrail">${escapeHTML(education.immigrationReference.guardrail)}</div></article>
        <article ${educationSearchAttrs(education.immigrationReference.cardQuestions)}><span class="kicker">Reference-card scope</span><h3>Research only what is decision-relevant</h3>${listHTML(education.immigrationReference.cardQuestions)}</article>
        <div class="policy-grid">${snapshot.records.filter((item) => item.id === 'oinp-masters-graduate').map(renderPolicyCard).join('')}</div>`],
      ['decision-checkpoints', `
        <article ${educationSearchAttrs(education.checkpoints)}><span class="kicker">Decision triggers · never deadlines</span><h3>Revalidate when the decision becomes actionable</h3><p>No countdown pressure and no overdue engineering states.</p></article>
        <div class="checkpoint-timeline">${education.checkpoints.map((item, index) => `<details class="checkpoint-trigger searchable" data-search="${escapeHTML(educationSearchText(item))}" ${index === 0 ? 'open' : ''}><summary><span>${String(index + 1).padStart(2, '0')}</span><div><h4>${escapeHTML(item.name)}</h4><p>${escapeHTML(item.trigger)}</p></div><span class="chevron">›</span></summary><div>${listHTML(item.verify)}</div></details>`).join('')}</div>`],
      ['canada-trajectory', `
        <article ${educationSearchAttrs(education.planningHorizon)}><span class="kicker">Canada trajectory · separate from Career trajectory</span><h3>${escapeHTML(horizon.value)} · ${escapeHTML(horizon.status)}</h3><p>${escapeHTML(horizon.meaning)}</p></article>
        <div class="canada-trajectory">${education.canadaTrajectory.map((item) => `<article class="canada-trajectory-item searchable" data-search="${escapeHTML(educationSearchText(item))}"><span>${escapeHTML(item.period)}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detail)}</p></div></article>`).join('')}</div>
        <article ${educationSearchAttrs(education.globalGuardrail)}><span class="kicker">Global guardrail</span><h3>Canada remains optional</h3><p>${escapeHTML(education.globalGuardrail)}</p></article>`]
    ];

    const layoutEl = $('#educationLayout');
    if (layoutEl) {
      layoutEl.innerHTML = panels.map(([id, content]) => `<section class="education-panel" id="education-panel-${escapeHTML(id)}" role="tabpanel" aria-labelledby="education-tab-${escapeHTML(id)}" data-education-panel="${escapeHTML(id)}" tabindex="0" ${id === activeEducationSection ? '' : 'hidden'}>${content}</section>`).join('');
    }
  }

  function showEducationPanel(id, focus = false) {
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
    if (focus) $(`#education-panel-${id}`)?.focus({ preventScroll: true });
  }

  function renderTrajectory() {
    const trajList = $('#trajectoryList');
    if (trajList) {
      trajList.innerHTML = DATA.trajectory.map((item) => `
        <article class="trajectory-item"><span class="trajectory-period">${escapeHTML(item.period)}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detail)}</p></div></article>`).join('');
    }
  }

  function buildCheckpointSnapshot() {
    const state = getState();
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
      missionId: overview.mission.id,
      mission: overview.mission.name,
      missionFirstAction: '',
      evidenceCount: state.evidence.length,
      evidence: provenEvidence.map((item) => item.label),
      remaining: remaining.slice(0, 6).map((item) => item.name),
      next: overview.nextTasks.map((item) => ({ id: item.id, name: item.name, firstAction: '' })),
      verifyOnce: overview.verifyOnce.map((item) => ({ id: item.id, name: item.name })),
      project: overview.project.name,
      ignore: DATA.currentPosition.ignoreNow,
      opportunities: DATA.roles.filter((role) => ['apply-now', 'apply-selectively'].includes(role.state)).map((role) => role.name),
      staleResources: staleResources.slice(0, 6).map((resource) => resource.name)
    };
  }

  function renderCheckpoint(record = false) {
    const state = getState();
    const snapshot = buildCheckpointSnapshot();
    const lastRun = record ? STORE.recordCheckpoint(snapshot).createdAt : state.careerCheckpoint.lastRunAt;
    const cards = [
      ['Where am I now?', snapshot.stage, 'Software Engineering Core unlocks serious ML. Professional SWE Depth continues in parallel.'],
      ['Current Focus / Mission', snapshot.mission, `<p>${escapeHTML(snapshot.missionFirstAction)}</p><button type="button" class="inline-action" data-open-node="${escapeHTML(snapshot.missionId)}">Open task recipe &amp; lab →</button>`],
      ['What follows?', `${snapshot.next.length} queued task${snapshot.next.length === 1 ? '' : 's'}`, snapshot.next.length ? `<ol class="checkpoint-actions">${snapshot.next.map((item) => `<li><button type="button" data-open-node="${escapeHTML(item.id)}"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML('')}</span></button></li>`).join('')}</ol>` : '<p>Complete current capabilities to advance to subsequent phases.</p>'],
      ['What should I verify once?', `${snapshot.verifyOnce.length} claim${snapshot.verifyOnce.length === 1 ? '' : 's'}`, snapshot.verifyOnce.length ? `<ul>${snapshot.verifyOnce.map((item) => `<li><button type="button" class="inline-action" data-open-node="${escapeHTML(item.id)}">${escapeHTML(item.name)}</button></li>`).join('')}</ul>` : '<p>No current verify-once items are waiting.</p>'],
      ['Personal notes &amp; state', `${snapshot.evidenceCount} saved evidence / notes`, 'Capability self-assessments and notes stay stored locally.'],
      ['Which project carries the proof?', snapshot.project, '<p>Upgrade the best authentic existing application. Open Project 1 from Projects ladder.</p>'],
      ['What can I ignore?', 'Not needed now', escapeHTML(snapshot.ignore)],
      ['Which opportunities are relevant?', 'Apply where capabilities overlap', `<ul>${snapshot.opportunities.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`],
      ['Resource freshness', `${snapshot.staleResources.length} need attention`, snapshot.staleResources.length ? `<ul>${snapshot.staleResources.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : 'All registered resources verified.'],
      ['Roadmap calibration', 'Recalibrate when facts change', `Last snapshot: ${lastRun ? escapeHTML(new Date(lastRun).toLocaleString()) : 'not yet recorded'}.`]
    ];

    const cardsHTML = cards.map(([question, title, body]) => `<article class="checkpoint-card"><span class="question">${escapeHTML(question)}</span><h3>${escapeHTML(title)}</h3>${String(body).startsWith('<') ? body : `<p>${body}</p>`}</article>`).join('');

    const chkGrid = $('#checkpointGrid');
    if (chkGrid) chkGrid.innerHTML = cardsHTML;

    const chkGridPanel = $('#checkpointGridPanel');
    if (chkGridPanel) chkGridPanel.innerHTML = cardsHTML;

    if (record) toast('Career GPS snapshot saved locally.');
  }

  function renderProgress() {
    const state = getState();
    const progress = baselineCapabilityCoverage();
    const textEl = $('#overallProgressText');
    if (textEl) textEl.textContent = `${progress}%`;
    const fillEl = $('#overallProgressFill');
    if (fillEl) fillEl.style.width = `${progress}%`;
    const detailEl = $('#overallProgressDetail');
    if (detailEl) detailEl.textContent = 'Approved baseline; not a task-completion score';
    const actionEl = $('#actionProgressText');
    if (actionEl) actionEl.textContent = String(actionCompletionCount(state));
  }

  function renderMapStatusFilter() {
    const select = $('#mapStatusFilter');
    if (!select) return;
    const current = select.value || 'all';
    select.innerHTML = `<option value="all">All evidence states</option>${Object.entries(DATA.statusLabels).map(([value, label]) => `<option value="${value}">${escapeHTML(label)}</option>`).join('')}`;
    select.value = Object.prototype.hasOwnProperty.call(DATA.statusLabels, current) ? current : 'all';
  }

  /* =========================================================================
     CONTEXT-PRESERVING RENDER (NO ACCIDENTAL COLLAPSE OF OPEN CARDS)
     ========================================================================= */

  function renderAll() {
    if (isRendering) return;
    isRendering = true;

    // 1. Capture Open UI State
    const openPhaseIds = new Set($$('#phaseList details[data-phase-id][open]').map((el) => el.dataset.phaseId));
    const openNodeIds = new Set($$('details[data-node-id][open]').map((el) => el.dataset.nodeId));
    const openProjectIds = new Set($$('details[data-project-id][open]').map((el) => el.dataset.projectId));
    const openRoleIds = new Set($$('details[data-role-id][open]').map((el) => el.dataset.roleId));
    const openResourceGuideIds = new Set($$('.resource-card details.resource-guide[open]').map((el) => el.closest('.resource-card')?.dataset?.resourceId).filter(Boolean));
    const isSweTrackOpen = $('#sweDepthTrack details.parallel-track-details')?.open;
    const isBaselineAuditOpen = $('#baselineAudit')?.closest('details')?.open;

    // 2. Render Components
    renderHome();
    renderArchitecture();
    renderPhases();
    renderProjects();
    renderReadiness();
    renderProof();
    renderResources();
    renderGlossary();
    renderEducation();
    renderTrajectory();
    renderCheckpoint(false);
    renderProgress();
    applyMapFilter();

    // 3. Restore Open UI State
    if (openPhaseIds.size > 0) {
      $$('#phaseList details[data-phase-id]').forEach((el) => {
        el.open = openPhaseIds.has(el.dataset.phaseId);
      });
    }
    if (openNodeIds.size > 0) {
      $$('details[data-node-id]').forEach((el) => {
        if (openNodeIds.has(el.dataset.nodeId)) {
          el.open = true;
          el.closest('.phase-card')?.setAttribute('open', '');
          el.closest('.parallel-track-details')?.setAttribute('open', '');
        }
      });
    }
    if (openProjectIds.size > 0) {
      $$('details[data-project-id]').forEach((el) => {
        el.open = openProjectIds.has(el.dataset.projectId);
      });
    }
    if (openRoleIds.size > 0) {
      $$('details[data-role-id]').forEach((el) => {
        el.open = openRoleIds.has(el.dataset.roleId);
      });
    }
    if (openResourceGuideIds.size > 0) {
      $$('.resource-card').forEach((card) => {
        if (openResourceGuideIds.has(card.dataset.resourceId)) {
          const guide = card.querySelector('details.resource-guide');
          if (guide) guide.open = true;
        }
      });
    }
    if (isSweTrackOpen) {
      const sweDetails = $('#sweDepthTrack details.parallel-track-details');
      if (sweDetails) sweDetails.open = true;
    }
    if (isBaselineAuditOpen !== undefined) {
      const auditDetails = $('#baselineAudit')?.closest('details');
      if (auditDetails) auditDetails.open = isBaselineAuditOpen;
    }

    isRendering = false;
  }

  function applyMapFilter() {
    const filter = $('#mapStatusFilter')?.value || 'all';
    $$('.node-card').forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.evidenceStatus !== filter;
    });
  }

  /* =========================================================================
     CROSS-VIEW NAVIGATION HELPERS (REVEAL, SCROLL, FOCUS)
     ========================================================================= */

  function openNode(nodeId) {
    switchView('map');
    closeSearchPanel();
    closeSidebar();

    setTimeout(() => {
      const card = document.querySelector(`[data-node-id="${CSS.escape(nodeId)}"]`);
      if (!card) return;

      const filterEl = $('#mapStatusFilter');
      if (filterEl && filterEl.value !== 'all') {
        filterEl.value = 'all';
        applyMapFilter();
      }

      card.closest('.phase-card')?.setAttribute('open', '');
      card.closest('.parallel-track-details')?.setAttribute('open', '');
      card.open = true;

      const headerOffset = 80;
      const elementPosition = card.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
      setTimeout(() => card.querySelector('summary')?.focus({ preventScroll: true }), 350);
    }, 50);
  }

  function openProject(projectId) {
    switchView('projects');
    closeSearchPanel();
    closeSidebar();

    setTimeout(() => {
      const card = document.querySelector(`[data-project-id="${CSS.escape(projectId)}"]`);
      if (!card) return;

      card.open = true;
      const headerOffset = 80;
      const elementPosition = card.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
      setTimeout(() => card.querySelector('summary')?.focus({ preventScroll: true }), 350);
    }, 50);
  }

  function openRole(roleId) {
    switchView('readiness');
    closeSearchPanel();
    closeSidebar();

    setTimeout(() => {
      const card = document.querySelector(`[data-role-id="${CSS.escape(roleId)}"]`);
      if (!card) return;

      card.open = true;
      const headerOffset = 80;
      const elementPosition = card.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
      setTimeout(() => card.querySelector('summary')?.focus({ preventScroll: true }), 350);
    }, 50);
  }

  function openResource(resourceId) {
    switchView('resources');
    closeSearchPanel();
    closeSidebar();

    setTimeout(() => {
      const card = document.querySelector(`[data-resource-id="${CSS.escape(resourceId)}"]`);
      if (!card) return;

      const guide = card.querySelector('details.resource-guide');
      if (guide) guide.open = true;

      const headerOffset = 80;
      const elementPosition = card.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
      setTimeout(() => card.focus({ preventScroll: true }), 350);
    }, 50);
  }

  /* =========================================================================
     GLOBAL SEARCH UX REPAIR (RESULTS SURFACE, KEYBOARD ACCESSIBLE)
     ========================================================================= */

  function buildSearchIndex() {
    const items = [];

    // 1. Nodes (Capabilities)
    allCapabilityNodes().forEach((node) => {
      items.push({
        id: node.id,
        dest: 'map',
        type: 'Capability',
        title: node.name,
        snippet: node.summary || node.whatIsThis,
        keywords: [node.id, node.name, node.summary, node.whatIsThis, node.why, node.whyNow, ...(node.teaches || []), ...(node.skip || []), node.handsOnLab?.title, node.completionCheck].join(' ').toLowerCase()
      });
    });

    // 2. Projects
    DATA.projects.forEach((proj) => {
      items.push({
        id: proj.id,
        dest: 'projects',
        type: 'Project',
        title: proj.name,
        snippet: proj.purpose || proj.direction,
        keywords: [proj.id, proj.name, proj.purpose, proj.direction, proj.domainBadge, ...(proj.mustProve || []), proj.proof, proj.whyThisProblem].join(' ').toLowerCase()
      });
    });

    // 3. Roles
    DATA.roles.forEach((role) => {
      items.push({
        id: role.id,
        dest: 'readiness',
        type: 'Career Role',
        title: role.name,
        snippet: role.whatItDoes || role.summary,
        keywords: [role.id, role.name, role.whatItDoes, role.summary, ...(role.searchTitles || []), ...(role.requirements || []), role.interviewExpectations].join(' ').toLowerCase()
      });
    });

    // 4. Opportunities
    DATA.opportunities.forEach((opp) => {
      items.push({
        id: opp.id,
        dest: 'readiness',
        type: 'Opportunity',
        title: opp.name,
        snippet: opp.summary,
        keywords: [opp.id, opp.name, opp.summary, opp.status, opp.eligibilityWarning, ...(opp.actions || [])].join(' ').toLowerCase()
      });
    });

    // 5. YouTube Courses
    (DATA.youtubeLearning || []).forEach((yt) => {
      items.push({
        id: yt.id,
        dest: 'resources',
        type: 'YouTube Course',
        title: yt.title,
        snippet: `${yt.creator} · ${yt.whySelected}`,
        keywords: [yt.id, yt.title, yt.creator, yt.whySelected, yt.selectedSections, yt.level].join(' ').toLowerCase()
      });
    });

    // 6. Official Resources
    DATA.resources.forEach((res) => {
      items.push({
        id: res.id,
        dest: 'resources',
        type: 'Resource',
        title: res.name,
        snippet: `${res.creator} · ${res.purpose}`,
        keywords: [res.id, res.name, res.creator, res.purpose, res.summary, res.why, res.teaches].join(' ').toLowerCase()
      });
    });

    // 7. Education & Canada
    DATA.education.sectionNav.forEach(([secId, secLabel]) => {
      items.push({
        id: secId,
        dest: 'education',
        type: 'Education & Canada',
        title: secLabel,
        snippet: `Strategic decision guidance for ${secLabel}.`,
        keywords: [secId, secLabel, 'canada', 'education', 'masters', 'visa', 'lakehead', 'pgwp', 'ielts'].join(' ').toLowerCase()
      });
    });

    // 8. Glossary
    (DATA.glossary || []).forEach((glo) => {
      items.push({
        id: `glossary-${glo.term}`,
        dest: 'glossary',
        type: 'Glossary Term',
        title: glo.term,
        snippet: glo.definition,
        keywords: [glo.term, glo.definition].join(' ').toLowerCase()
      });
    });

    return items;
  }

  let searchIndex = null;

  function performGlobalSearch(query) {
    const trimmed = query.trim().toLowerCase();
    const panel = $('#searchResultsPanel');
    const listEl = $('#searchResultsList');
    const countEl = $('#searchResultsCount');

    if (!trimmed) {
      closeSearchPanel();
      return;
    }

    if (!searchIndex) {
      searchIndex = buildSearchIndex();
    }

    const matches = searchIndex.filter((item) => item.keywords.includes(trimmed)).slice(0, 10);

    if (panel && listEl) {
      panel.removeAttribute('hidden');
      if (countEl) countEl.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} found`;

      if (matches.length === 0) {
        listEl.innerHTML = `<div class="search-results-empty">No matches found for "<strong>${escapeHTML(trimmed)}</strong>".</div>`;
      } else {
        listEl.innerHTML = matches.map((item) => `
          <button type="button" class="search-result-item" data-search-dest="${escapeHTML(item.dest)}" data-search-id="${escapeHTML(item.id)}" data-search-type="${escapeHTML(item.type)}">
            <div class="search-result-head">
              <strong>${escapeHTML(item.title)}</strong>
              <span class="search-result-dest">${escapeHTML(item.type)}</span>
            </div>
            <p class="search-result-snippet">${escapeHTML(item.snippet)}</p>
          </button>
        `).join('');
      }
    }
  }

  function closeSearchPanel() {
    $('#searchResultsPanel')?.setAttribute('hidden', '');
  }

  function handleSearchResultClick(dest, targetId, type) {
    if (dest === 'map') {
      openNode(targetId);
    } else if (dest === 'projects') {
      openProject(targetId);
    } else if (dest === 'readiness') {
      if (type === 'Career Role') openRole(targetId);
      else switchView('readiness');
    } else if (dest === 'resources') {
      openResource(targetId);
    } else if (dest === 'education') {
      switchView('education');
      showEducationPanel(targetId, true);
    } else if (dest === 'glossary') {
      switchView('home');
      toast(`Glossary Term: ${targetId.replace('glossary-', '')}`);
    } else {
      switchView(dest);
    }

    closeSearchPanel();
    const searchInput = $('#globalSearch');
    if (searchInput) searchInput.value = '';
  }

  /* =========================================================================
     BACKUPS & EXPORT/IMPORT
     ========================================================================= */

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

  function closeSidebar() {
    $('#sidebar')?.classList.remove('open');
    $('#sidebarOverlay')?.classList.remove('visible');
    $('#menuButton')?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }

  /* =========================================================================
     EVENT LISTENERS SETUP
     ========================================================================= */

  function setupEventListeners() {
    // Hash navigation
    window.addEventListener('hashchange', handleHashChange);

    // Primary View Link Interception
    document.addEventListener('click', (event) => {
      const navLink = event.target.closest('a[href^="#"]');
      if (navLink) {
        const hash = navLink.getAttribute('href').replace(/^#/, '');
        if (VALID_PRIMARY_VIEWS.includes(hash)) {
          event.preventDefault();
          switchView(hash, true);
          closeSidebar();
        } else if (hash === 'checkpoint') {
          event.preventDefault();
          openSettingsPanel();
          closeSidebar();
        }
      }
    });

    // Form inputs and status changes
    document.addEventListener('change', (event) => {
      const progressId = event.target.dataset.nodeProgress;
      const statusId = event.target.dataset.nodeStatus;
      const resourceId = event.target.dataset.resourceStatus;
      const completionCheckId = event.target.dataset.completionCheck;

      if (progressId) {
        STORE.setNodeState(progressId, { progress: event.target.value });
        toast(`${DATA.progressLabels[event.target.value]} saved.`);
      }
      if (statusId) {
        STORE.setNodeState(statusId, { evidenceStatus: event.target.value });
        toast(`Evidence status updated to ${DATA.statusLabels[event.target.value]}.`);
      }
      if (completionCheckId) {
        const nextProgress = event.target.checked ? 'completed' : 'in-progress';
        STORE.setNodeState(completionCheckId, { progress: nextProgress });
        toast(event.target.checked ? 'Capability marked completed!' : 'Capability marked in progress.');
      }
      if (resourceId) {
        STORE.setResourceVerification(resourceId, { status: event.target.value, lastVerified: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) });
        toast('Resource verification state updated.');
      }
    });

    document.addEventListener('input', (event) => {
      const noteId = event.target.dataset.nodeNote;
      if (noteId) saveNodeNote(noteId, event.target.value);
    });

    document.addEventListener('click', (event) => {
      const openNodeButton = event.target.closest('[data-open-node]');
      const openProjectButton = event.target.closest('[data-open-project]');
      const openRoleButton = event.target.closest('[data-open-role]');
      const pinButton = event.target.closest('[data-pin-node]');
      const unpinButton = event.target.closest('[data-unpin-node]');
      const pinToggleButton = event.target.closest('[data-pin-toggle]');
      const educationTab = event.target.closest('[data-education-tab]');
      const searchResultItem = event.target.closest('.search-result-item');

      if (openNodeButton) openNode(openNodeButton.dataset.openNode);
      if (openProjectButton) openProject(openProjectButton.dataset.openProject);
      if (openRoleButton) openRole(openRoleButton.dataset.openRole);

      if (pinButton) {
        STORE.setWorkingNode(pinButton.dataset.pinNode);
        toast('Task pinned to dashboard!');
      }
      if (unpinButton) {
        STORE.clearWorkingNode();
        toast('Task unpinned.');
      }
      if (pinToggleButton) {
        const targetId = pinToggleButton.dataset.pinToggle;
        if (STORE.getWorkingNode() === targetId) {
          STORE.clearWorkingNode();
          toast('Task unpinned.');
        } else {
          STORE.setWorkingNode(targetId);
          toast('Task pinned to dashboard!');
        }
      }

      if (educationTab) {
        showEducationPanel(educationTab.dataset.educationTab, true);
      }

      if (searchResultItem) {
        handleSearchResultClick(
          searchResultItem.dataset.searchDest,
          searchResultItem.dataset.searchId,
          searchResultItem.dataset.searchType
        );
      }
    });

    // Education mobile dropdown sync
    $('#educationMobileSelect')?.addEventListener('change', (event) => {
      showEducationPanel(event.target.value, false);
    });

    $('#mapStatusFilter')?.addEventListener('change', applyMapFilter);
    $('#resourceStageFilter')?.addEventListener('change', renderResources);
    $('#resourceStatusFilter')?.addEventListener('change', renderResources);

    $('#educationSubnav')?.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = $$('[data-education-tab]');
      const currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex < 0) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      showEducationPanel(tabs[nextIndex].dataset.educationTab);
    });

    // Search input
    $('#globalSearch')?.addEventListener('input', debounce((event) => {
      performGlobalSearch(event.target.value);
    }, 100));

    $('#globalSearch')?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.currentTarget.value = '';
        closeSearchPanel();
        event.currentTarget.blur();
      }
    });

    $('#searchResultsClose')?.addEventListener('click', closeSearchPanel);

    // Close search panel when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.search-control') && !event.target.closest('#searchResultsPanel')) {
        closeSearchPanel();
      }
    });

    $('#expandAllNodes')?.addEventListener('click', (event) => {
      const nodes = $$('.node-card:not([hidden])');
      const shouldOpen = nodes.some((node) => !node.open);
      nodes.forEach((item) => { item.open = shouldOpen; });
      event.currentTarget.textContent = shouldOpen ? 'Collapse all' : 'Expand all';
    });

    $('#themeToggle')?.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

    // Mobile Drawer
    $('#menuButton')?.addEventListener('click', () => {
      const isOpen = !$('#sidebar').classList.contains('open');
      $('#sidebar').classList.toggle('open', isOpen);
      $('#sidebarOverlay').classList.toggle('visible', isOpen);
      $('#menuButton').setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('no-scroll', isOpen);
    });

    $('#sidebarOverlay')?.addEventListener('click', closeSidebar);
    $$('.nav-link').forEach((link) => link.addEventListener('click', closeSidebar));

    // Settings Panel Controls
    $('#openSettingsButton')?.addEventListener('click', openSettingsPanel);
    $('#settingsPanelClose')?.addEventListener('click', closeSettingsPanel);
    $('#settingsPanelOverlay')?.addEventListener('click', closeSettingsPanel);

    // Backups & Snapshots
    const handleBackupExport = () => downloadBackup();
    $('#exportButton')?.addEventListener('click', handleBackupExport);
    $('#exportButtonPanel')?.addEventListener('click', handleBackupExport);

    const handleImportClick = () => $('#importFile')?.click();
    $('#importButton')?.addEventListener('click', handleImportClick);
    $('#importButtonPanel')?.addEventListener('click', () => $('#importFilePanel')?.click());

    const handleFileImport = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const payload = JSON.parse(await file.text());
        STORE.importPayload(payload);
        toast('ATLAS backup imported and migrated safely.');
      } catch (error) {
        toast(error.message || 'Could not import this backup.');
      } finally {
        event.target.value = '';
      }
    };
    $('#importFile')?.addEventListener('change', handleFileImport);
    $('#importFilePanel')?.addEventListener('change', handleFileImport);

    const handleResetPrompt = () => {
      const confirmationInput = $('#resetConfirmation');
      const confirmButton = $('#confirmResetButton');
      if (confirmationInput) confirmationInput.value = '';
      if (confirmButton) confirmButton.disabled = true;
      $('#resetDialog')?.showModal();
    };
    $('#resetButton')?.addEventListener('click', handleResetPrompt);
    $('#resetButtonPanel')?.addEventListener('click', handleResetPrompt);

    $('#resetConfirmation')?.addEventListener('input', (event) => {
      const confirmButton = $('#confirmResetButton');
      if (confirmButton) confirmButton.disabled = event.target.value !== 'RESET';
    });

    $('#resetForm')?.addEventListener('submit', (event) => {
      if (event.submitter?.value === 'cancel') return;
      event.preventDefault();
      if ($('#resetConfirmation').value !== 'RESET') return;
      downloadBackup();
      STORE.reset();
      $('#resetDialog')?.close();
      toast('ATLAS reset to approved baseline; backup downloaded first.');
    });

    const handleCheckpointSave = () => renderCheckpoint(true);
    $('#runCheckpointButton')?.addEventListener('click', handleCheckpointSave);
    $('#runCheckpointButtonPanel')?.addEventListener('click', handleCheckpointSave);

    $('#backToTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', debounce(() => $('#backToTop')?.classList.toggle('visible', window.scrollY > 400), 50), { passive: true });

    document.addEventListener('keydown', (event) => {
      // Search shortcuts
      if ((event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) || (event.ctrlKey && event.key.toLowerCase() === 'k') || (event.metaKey && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        $('#globalSearch')?.focus();
      }
      // Escape closes settings or mobile drawer
      if (event.key === 'Escape') {
        if (!$('#settingsPanel')?.hasAttribute('hidden')) {
          closeSettingsPanel();
        } else if ($('#sidebar')?.classList.contains('open')) {
          closeSidebar();
        }
      }
    });

    window.addEventListener('atlas:statechange', () => {
      renderAll();
    });
  }

  function initialize() {
    setTheme(STORE.getTheme());
    renderMapStatusFilter();
    renderResourceFilters();
    renderAll();
    setupEventListeners();

    // Initial View setup based on URL hash
    const initialHash = window.location.hash.replace(/^#/, '');
    if (initialHash === 'checkpoint') {
      switchView('home', false);
      openSettingsPanel();
    } else if (VALID_PRIMARY_VIEWS.includes(initialHash)) {
      switchView(initialHash, false);
    } else {
      switchView('home', false);
    }

    window.ATLAS = {
      data: DATA,
      store: STORE,
      render: renderAll,
      getOverviewModel,
      getCurrentActionModel,
      openNode,
      openProject,
      openRole,
      switchView,
      checkpoint: () => renderCheckpoint(true),
      export: STORE.exportPayload
    };
  }

  initialize();
})();

//testing
