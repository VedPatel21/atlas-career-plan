const fs = require('fs');
let code = fs.readFileSync('state.js', 'utf8');

// Define VALID_NODE_IDS
const validNodeIdsDef = `
  const VALID_EVIDENCE_STATUS = new Set(Object.keys(DATA.statusLabels));

  function allNodes() {
    return [
      ...DATA.phases.flatMap((phase) => phase.nodes),
      ...DATA.sweDepth.nodes
    ];
  }

  const VALID_NODE_IDS = new Set([
    ...allNodes().map(n => n.id),
    ...DATA.projects.map(p => p.id)
  ]);
`;
code = code.replace(
  /const VALID_EVIDENCE_STATUS = new Set\(Object\.keys\(DATA\.statusLabels\)\);\n\n  const clone = \(value\) => JSON\.parse\(JSON\.stringify\(value\)\);\n  const now = \(\) => new Date\(\)\.toISOString\(\);\n\n  function safeParse\(value, fallback = null\) \{\n    try \{ return JSON\.parse\(value\); \} catch \(_\) \{ return fallback; \}\n  \}\n\n  function allNodes\(\) \{\n    return \[\n      \.\.\.DATA\.phases\.flatMap\(\(phase\) => phase\.nodes\),\n      \.\.\.DATA\.sweDepth\.nodes\n    \];\n  \}/,
  validNodeIdsDef + '\n  const clone = (value) => JSON.parse(JSON.stringify(value));\n  const now = () => new Date().toISOString();\n\n  function safeParse(value, fallback = null) {\n    try { return JSON.parse(value); } catch (_) { return fallback; }\n  }'
);

// Fix migrateState
code = code.replace(
  /workingNodeId: typeof incoming\.workingNodeId === 'string' \? incoming\.workingNodeId : null,/g,
  "workingNodeId: typeof incoming.workingNodeId === 'string' && VALID_NODE_IDS.has(incoming.workingNodeId) ? incoming.workingNodeId : null,"
);

// Fix setWorkingNode
code = code.replace(
  /state\.workingNodeId = nodeId \? String\(nodeId\) : null;/g,
  "state.workingNodeId = nodeId && VALID_NODE_IDS.has(String(nodeId)) ? String(nodeId) : null;"
);

fs.writeFileSync('state.js', code);
console.log('Fixed state.js');
