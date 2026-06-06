import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "src", "lib"), { recursive: true });

copy("index.html", "index.html");
copy(path.join("src", "plain-app.js"), path.join("src", "plain-app.js"));
copy(path.join("src", "styles.css"), path.join("src", "styles.css"));
copy(path.join("src", "lib", "assessment.js"), path.join("src", "lib", "assessment.js"));

console.log("Built dist/");

function copy(from, to) {
  fs.copyFileSync(path.join(root, from), path.join(dist, to));
}
