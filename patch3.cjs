const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix INITIAL_LINE_CONFIG import
code = code.replace(/INITIAL_PROMPTPAY,/, "INITIAL_LINE_CONFIG,\n  INITIAL_PROMPTPAY,");

// Remove localstorage syncing useEffects
code = code.replace(/\/\/ Sync state changes to storage\s*useEffect\(\(\) => \{\s*saveBills\(bills\);\s*\}, \[bills\]\);\s*useEffect\(\(\) => \{\s*savePeople\(people\);\s*\}, \[people\]\);\s*useEffect\(\(\) => \{\s*saveLineConfig\(lineConfig\);\s*\}, \[lineConfig\]\);\s*useEffect\(\(\) => \{\s*savePromptPayConfig\(promptPayConfig\);\s*\}, \[promptPayConfig\]\);/g, '');

// Fix savePeople in handleGoogleLogin
code = code.replace(/setPeople\(updatedPeople\);\s*savePeople\(updatedPeople\);/, "updatedPeople.forEach(p => fb.savePerson(p));");

fs.writeFileSync('src/App.tsx', code);

// Fix firebase.ts type error
let fbCode = fs.readFileSync('src/firebase.ts', 'utf8');
fbCode = '/// <reference types="vite/client" />\n' + fbCode;
fs.writeFileSync('src/firebase.ts', fbCode);
