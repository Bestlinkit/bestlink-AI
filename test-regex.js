const accumulatedCode = `{
  "type": "project",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "import React from 'react';\\nexport default function App() {\\n  return <div>Hello</div>;\\n}"
    }
  ]
}`;

const fileRegex = /"path"\s*:\s*"([^"]+)",\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)/g;
let match;
while ((match = fileRegex.exec(accumulatedCode)) !== null) {
  console.log("Path:", match[1]);
  console.log("Content Raw:", match[2]);
}
