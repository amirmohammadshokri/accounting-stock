Stimulsoft Reports.JS runtime: 2024.3.2, installed from the official stimulsoft-reports-js npm package.
Local runtime/license/third-party files are copied from node_modules to public/vendor/stimulsoft/2024.3.2 by scripts/prepare-report-designer.cjs during npm install/start/build/test/watch. Angular serves them through its standard public directory.
Persian localization source: https://github.com/stimulsoft/Stimulsoft.Reports.Localization/blob/master/fa.xml
Vazirmatn font: OFL.txt, same font as the server-side PDF renderer.
The iframe has an opaque sandbox origin. sandbox-storage.js provides temporary browser storage required by the SDK without exposing app storage. Communication checks both the exact Window and a per-editor nonce. No access tokens or database connections are passed into the iframe.
