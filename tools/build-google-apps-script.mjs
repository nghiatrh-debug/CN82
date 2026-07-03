import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const dashboardDir = path.join(root, "dashboard");
const outDir = path.join(root, "outputs", "google-apps-script-cn8-2");

function read(name) {
  return fs.readFileSync(path.join(dashboardDir, name), "utf8");
}

function escapeTemplateLiteral(value) {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

fs.mkdirSync(outDir, { recursive: true });

const html = read("index.html");
const css = read("styles.css");
const dataJs = read("data.js");
const appJs = read("app.js");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(dataJs, context, { filename: "data.js" });
const data = context.window.CN8_DATA;
const dataJson = JSON.stringify(data, null, 2);

const bodyHtml = html
  .replace(/<link rel="stylesheet" href="\.\/styles\.css">\s*/u, "")
  .replace(/\s*<script src="\.\/data\.js"><\/script>/u, "")
  .replace(/\s*<script src="\.\/app\.js"><\/script>/u, "");

const indexForAppsScript = bodyHtml.replace(
  "</head>",
  `  <style>\n${css}\n  </style>\n</head>`
).replace(
  "</body>",
  `  <script>\nwindow.CN8_DATA = <?!= dashboardDataJson ?>;\n  </script>\n  <script>\n${appJs}\n  </script>\n</body>`
);

const codeGs = `const DASHBOARD_DATA_FILE_ID = "";
const DASHBOARD_DATA_FILE_NAME = "CN8-2_dashboard-data.json";

const FALLBACK_DASHBOARD_DATA_JSON = \`${escapeTemplateLiteral(dataJson)}\`;

function doGet() {
  const template = HtmlService.createTemplateFromFile("Index");
  template.dashboardDataJson = getDashboardDataJson();
  return template
    .evaluate()
    .setTitle("CN8-2 | Project Control")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  return JSON.parse(getDashboardDataJson());
}

function getDashboardDataJson() {
  if (DASHBOARD_DATA_FILE_ID) {
    try {
      return DriveApp.getFileById(DASHBOARD_DATA_FILE_ID)
        .getBlob()
        .getDataAsString("UTF-8");
    } catch (error) {
      console.warn("Cannot read dashboard data by file ID, trying file name: " + error);
    }
  }

  if (DASHBOARD_DATA_FILE_NAME) {
    try {
      const file = findLatestDashboardDataFileByName_(DASHBOARD_DATA_FILE_NAME);
      if (file) {
        return file.getBlob().getDataAsString("UTF-8");
      }
    } catch (error) {
      console.warn("Cannot read dashboard data by file name, using fallback: " + error);
    }
  }

  return FALLBACK_DASHBOARD_DATA_JSON;
}

function findLatestDashboardDataFileByName_(fileName) {
  const files = DriveApp.getFilesByName(fileName);
  let latestFile = null;
  let latestTime = 0;
  while (files.hasNext()) {
    const file = files.next();
    const modifiedTime = file.getLastUpdated().getTime();
    if (modifiedTime > latestTime) {
      latestFile = file;
      latestTime = modifiedTime;
    }
  }
  return latestFile;
}
`;

const manifest = {
  timeZone: "Asia/Ho_Chi_Minh",
  dependencies: {},
  exceptionLogging: "STACKDRIVER",
  runtimeVersion: "V8",
  oauthScopes: [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  webapp: {
    executeAs: "USER_DEPLOYING",
    access: "DOMAIN"
  }
};

const readme = `# CN8-2 Google Apps Script Web App

This package publishes the CN8-2 dashboard as a Google Apps Script web app that can be embedded in Google Sites.

## Files

- \`Code.gs\`: Apps Script entry point and optional Drive JSON loader.
- \`Index.html\`: Self-contained dashboard UI.
- \`appsscript.json\`: Apps Script manifest.
- \`dashboard-data.json\`: Current dashboard data snapshot from \`dashboard/data.js\`.
- \`CN8-2_dashboard-data.json\`: Drive data file used by the live refresh button.

## Recommended Setup

1. Open https://script.google.com and create a new project named \`CN8-2 Dashboard\`.
2. Enable project settings > Show appsscript.json manifest file.
3. Replace the default files with this package:
   - Create/replace \`Code.gs\`.
   - Create \`Index.html\`.
   - Replace \`appsscript.json\`.
4. Deploy > New deployment > Web app:
   - Description: \`CN8-2 dashboard MVP\`.
   - Execute as: \`Me\`.
   - Who has access: choose your Workspace domain or specific access allowed by IT.
5. Copy the Web app URL.
6. In Google Sites, use Insert > Embed > Embed URL and paste the Web app URL.

## Live Data File And Refresh Button

The web app first tries to read the live dashboard data from Google Drive. This lets the refresh button update the dashboard without redeploying code.

1. Upload \`CN8-2_dashboard-data.json\` to Google Drive.
2. Share it so the Apps Script deployment account can read it.
3. Keep the file name exactly \`CN8-2_dashboard-data.json\`; Apps Script can find the newest file by this name.
4. For stricter targeting, copy the file ID from the Drive URL and set \`DASHBOARD_DATA_FILE_ID\` in \`Code.gs\`.
5. Redeploy the web app once after setting the file name or file ID.

After that, replacing the content of the same Drive JSON file will update the web dashboard when the user presses the refresh button.
`;

fs.writeFileSync(path.join(outDir, "Code.gs"), codeGs, "utf8");
fs.writeFileSync(path.join(outDir, "Index.html"), indexForAppsScript, "utf8");
fs.writeFileSync(path.join(outDir, "appsscript.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(outDir, "dashboard-data.json"), `${dataJson}\n`, "utf8");
fs.writeFileSync(path.join(outDir, "CN8-2_dashboard-data.json"), `${dataJson}\n`, "utf8");
fs.writeFileSync(path.join(outDir, "README.md"), readme, "utf8");

console.log(`Built Google Apps Script package: ${outDir}`);
