# CN8-2 Google Apps Script Web App

This package publishes the CN8-2 dashboard as a Google Apps Script web app that can be embedded in Google Sites.

## Files

- `Code.gs`: Apps Script entry point and optional Drive JSON loader.
- `Index.html`: Self-contained dashboard UI.
- `appsscript.json`: Apps Script manifest.
- `dashboard-data.json`: Current dashboard data snapshot from `dashboard/data.js`.
- `CN8-2_dashboard-data.json`: Drive data file used by the live refresh button.

## Recommended Setup

1. Open https://script.google.com and create a new project named `CN8-2 Dashboard`.
2. Enable project settings > Show appsscript.json manifest file.
3. Replace the default files with this package:
   - Create/replace `Code.gs`.
   - Create `Index.html`.
   - Replace `appsscript.json`.
4. Deploy > New deployment > Web app:
   - Description: `CN8-2 dashboard MVP`.
   - Execute as: `Me`.
   - Who has access: choose your Workspace domain or specific access allowed by IT.
5. Copy the Web app URL.
6. In Google Sites, use Insert > Embed > Embed URL and paste the Web app URL.

## Live Data File And Refresh Button

The web app first tries to read the live dashboard data from Google Drive. This lets the refresh button update the dashboard without redeploying code.

1. Upload `CN8-2_dashboard-data.json` to Google Drive.
2. Share it so the Apps Script deployment account can read it.
3. Keep the file name exactly `CN8-2_dashboard-data.json`; Apps Script can find the newest file by this name.
4. For stricter targeting, copy the file ID from the Drive URL and set `DASHBOARD_DATA_FILE_ID` in `Code.gs`.
5. Redeploy the web app once after setting the file name or file ID.

After that, replacing the content of the same Drive JSON file will update the web dashboard when the user presses the refresh button.
