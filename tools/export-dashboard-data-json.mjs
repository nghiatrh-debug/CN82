import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const dataJsPath = path.join(root, "dashboard", "data.js");
const defaultOut = path.join(root, "outputs", "google-apps-script-cn8-2", "CN8-2_dashboard-data.json");
const outPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultOut;

const dataJs = fs.readFileSync(dataJsPath, "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(dataJs, context, { filename: "data.js" });

if (!context.window.CN8_DATA) {
  throw new Error("window.CN8_DATA not found in dashboard/data.js");
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(context.window.CN8_DATA, null, 2)}\n`, "utf8");
console.log(outPath);
