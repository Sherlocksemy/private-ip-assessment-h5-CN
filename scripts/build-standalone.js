import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const styles = fs.readFileSync(path.join(root, "src/styles.css"), "utf8");
const assessment = fs
  .readFileSync(path.join(root, "src/lib/assessment.js"), "utf8")
  .replace(/export const /g, "const ")
  .replace(/export function /g, "function ");
const app = fs
  .readFileSync(path.join(root, "src/plain-app.js"), "utf8")
  .replace('import { dimensions, groupQuestions, questions, scoreAssessment } from "./lib/assessment.js";\n\n', "");

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f7ebd7" />
    <title>私域IP商业变现测评</title>
    <style>
${styles}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
${assessment}

${app}
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(root, "demo.html"), html, "utf8");
console.log("Generated demo.html");
