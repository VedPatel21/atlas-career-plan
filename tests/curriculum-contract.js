'use strict';

const { createHash } = require('node:crypto');

function curriculumContract(data) {
  const nodes = [...data.phases.flatMap((phase) => phase.nodes), ...data.sweDepth.nodes];
  const sections = {
    phases: data.phases.map((phase) => [phase.id, phase.order, phase.prerequisites, phase.nodes.map((node) => node.id)]),
    parallelTrack: data.sweDepth.nodes.map((node) => node.id),
    capabilityPrerequisites: nodes.map((node) => [node.id, node.prerequisites]),
    taskResources: nodes.map((node) => [node.id, node.resourceIds]),
    taskResourceContext: data.taskResourceContext,
    resources: data.resources,
    youtubeLearning: data.youtubeLearning,
    orientationVideos: data.orientationVideos,
    projects: data.projects,
    roles: data.roles.map((role) => [role.id, role.requiredNodeIds, role.requiredProjects, role.projectId]),
    education: data.education,
    opportunities: data.opportunities,
    discoveryPlatforms: data.discoveryStack
  };
  return Object.fromEntries(Object.entries(sections).map(([name, content]) => {
    const hash = createHash('sha256').update(JSON.stringify(content)).digest('hex');
    return [name, hash];
  }));
}

module.exports = curriculumContract;
