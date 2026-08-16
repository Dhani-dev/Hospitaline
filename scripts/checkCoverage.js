const fs = require("fs");
const path = require("path");

const requiredThreshold = Number(process.argv[2] || 0);
const summaryPath = path.resolve(process.cwd(), "coverage", "coverage-summary.json");

if (!fs.existsSync(summaryPath)) {
  console.error("coverage-summary.json not found. Run npm run test:coverage first.");
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const linesPct = summary.total?.lines?.pct ?? 0;

if (linesPct < requiredThreshold) {
  console.error(
    `Coverage check failed. Required: ${requiredThreshold}%, Current: ${linesPct}%`
  );
  process.exit(1);
}

console.log(`Coverage check passed. Required: ${requiredThreshold}%, Current: ${linesPct}%`);
