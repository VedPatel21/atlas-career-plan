const fs = require('fs');
let data = fs.readFileSync('data.js', 'utf8');

// YT1 - Pytest
data = data.replace(
  /"title": "Pytest Tutorial – How to Test Python Code",\n\s*"creator": "freeCodeCamp.org \(Dave Gray\)",\n\s*"url": "https:\/\/www.youtube.com\/watch\?v=1LBFgdrsEsU",/g,
  '"title": "Pytest Tutorial – How to Test Python Code",\n    "creator": "freeCodeCamp.org (Rithmic)",\n    "url": "https://www.youtube.com/watch?v=QAa2O_8wBUQ",'
);

// YT2 - Docker
data = data.replace(
  /"title": "Docker Tutorial for Beginners",\n\s*"creator": "TechWorld with Nana",\n\s*"url": "https:\/\/www.youtube.com\/watch\?v=3c-i724u3Sg",/g,
  '"title": "Docker Crash Course for Absolute Beginners [NEW]",\n    "creator": "TechWorld with Nana",\n    "url": "https://www.youtube.com/watch?v=3c-iLYHCgeo",'
);

// YT4 - DSA
data = data.replace(
  /"title": "Data Structures and Algorithms Mega Course",\n\s*"creator": "freeCodeCamp.org \/ Abdul Bari",\n\s*"url": "https:\/\/www.youtube.com\/watch\?v=Fj-ahigG9h8",/g,
  '"title": "Data Structures and Algorithms Mega Course – Master Technical Interviews in 49 Hours",\n    "creator": "freeCodeCamp.org / Destination FAANG",\n    "url": "https://www.youtube.com/watch?v=8hly31xKli0",'
);

// YT5 - Linear Algebra
data = data.replace(
  /"id": "YT5",([\s\S]*?)"title": "Essence of Linear Algebra",\n\s*"creator": "3Blue1Brown",\n\s*"url": "https:\/\/www.youtube.com\/playlist\?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr",/g,
  '"id": "YT5",$1"title": "Essence of Linear Algebra",\n    "creator": "3Blue1Brown",\n    "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",'
);

// YT9 - FastAPI
data = data.replace(
  /"title": "FastAPI Course for Beginners - Python Web Framework",\n\s*"creator": "Traversy Media \/ Sanjeev Thiyagarajan",\n\s*"url": "https:\/\/www.youtube.com\/watch\?v=0sOvCWFmrtA",\n\s*"type": "FULL COURSE",\n\s*"duration": "3 hr 30 min",/g,
  '"title": "Python API Development - Comprehensive Course for Beginners",\n    "creator": "freeCodeCamp.org / Sanjeev Thiyagarajan",\n    "url": "https://www.youtube.com/watch?v=0sOvCWFmrtA",\n    "type": "FULL COURSE",\n    "duration": "19 hr",'
);

// YT14 - RAG
data = data.replace(
  /"title": "Production RAG and Vector Databases",\n\s*"creator": "freeCodeCamp.org \/ LangChain & DeepLearning.AI",\n\s*"url": "https:\/\/www.youtube.com\/watch\?v=sVcwVQRHIc8",/g,
  '"title": "Learn RAG From Scratch",\n    "creator": "freeCodeCamp.org / LangChain",\n    "url": "https://www.youtube.com/watch?v=sVcwVQRHIc8",'
);

// Fix Mitacs Eligibility
data = data.replace(
  /"status": "ELIGIBLE - SEPTEMBER 16 2026 DEADLINE",/g,
  '"status": "CURRENTLY NOT ELIGIBLE — INSTITUTION NOT ON 2027 INDIA ELIGIBILITY LIST",\n        "deadline": "September 16, 2026 (For Reference)",\n        "recheckNote": "Recheck in future cycles when institution lists are updated",'
);

fs.writeFileSync('data.js', data);
console.log('Fixed some youtube links and Mitacs');
