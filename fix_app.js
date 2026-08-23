const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Remove evidence UI event listeners and functions
code = code.replace(/const evidenceDialog = \$\('#evidenceDialog'\);\nconst evidenceForm = \$\('#evidenceForm'\);\n/g, '');
code = code.replace(/function openEvidenceAudit\([\s\S]*?\}\n/g, '');
code = code.replace(/function buildEvidenceAudit\([\s\S]*?\}\n/g, '');
code = code.replace(/evidenceForm\?.addEventListener\([\s\S]*?\}\);\n/g, '');
code = code.replace(/addEvidenceButton\?.addEventListener\([\s\S]*?\}\);\n/g, '');

// 2. Remove 'Testing -> Docker -> Basic CI' from buildPositionPanel
code = code.replace(
  /<div class="next-node">[\s\S]*?<\/div>/g,
  ''
);
// Also remove it from parallel track description
code = code.replace(
  /They run in parallel with Core: Testing → Docker → Basic CI\./g,
  'They run in parallel with the Core phases.'
);

// 3. Update completionCheck generic fallback
code = code.replace(
  /const completionCheck = item\.completionCheck \|\| item\.proof \|\| 'You can demonstrate this capability independently in a real project\.';/g,
  "const completionCheck = item.completionCheck || item.proof || 'You can apply this capability independently.';"
);

// 4. Fix dynamic role readiness to count ONLY 'completed' and 'already-proven'
code = code.replace(
  /const completedNodes = requiredNodes\.filter\(\(n\) => n\.progress === 'completed'\)\.length;/g,
  "const completedNodes = requiredNodes.filter((n) => n.progress === 'completed' || n.evidenceStatus === 'already-proven').length;"
);

// 5. Remove firstAction usages from buildOverview (the nextTasks generation)
code = code.replace(
  /<small>\$\{escapeHTML\(item\.firstAction\)\}<\/small>/g,
  ''
);

// 6. Remove firstAction from mission-card
code = code.replace(
  /<div class="mission-first"><span>Do this first<\/span><p>\$\{escapeHTML\(overview\.mission\.firstAction\)\}<\/p><\/div>/g,
  ''
);
code = code.replace(
  /overview\.mission\.firstAction/g,
  "''"
);
code = code.replace(
  /item\.firstAction/g,
  "''"
);

// 7. Remove firstAction from recipe parsing in renderNodeRecipe
code = code.replace(
  /, item\.firstAction/g,
  ""
);
code = code.replace(
  /<p>\$\{escapeHTML\(item\.firstAction\)\}<\/p>/g,
  ""
);

// 8. Remove starting evidence text replacement
code = code.replace(
  /'Approved starting evidence'/g,
  "'Starting Capability Snapshot'"
);
code = code.replace(
  />Approved starting evidence</g,
  ">Starting Capability Snapshot<"
);

fs.writeFileSync('app.js', code);
console.log('Fixed app.js');
