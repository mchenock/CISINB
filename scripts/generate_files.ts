import * as XLSX from "xlsx";
import * as fs from "fs";
import {
  controlsData,
  checklistByPageData,
  commandsData,
  extractionLogs,
  summaryData
} from "../src/data/controlsData.js";
import {
  mariadbControlsData,
  mariadbChecklistByPageData,
  mariadbCommandsData,
  mariadbExtractionLogs,
  mariadbSummaryData
} from "../src/data/mariadbData.js";
import {
  sqlserverControlsData,
  sqlserverChecklistByPageData,
  sqlserverCommandsData,
  sqlserverExtractionLogs,
  sqlserverSummaryData
} from "../src/data/sqlserverData.js";
import {
  oracle19cControlsData,
  oracle19cChecklistByPageData,
  oracle19cCommandsData,
  oracle19cExtractionLogs,
  oracle19cSummaryData
} from "../src/data/oracle19cData.js";

function generateForProduct(
  namePrefix,
  controls,
  checklist,
  commands,
  logs,
  summary
) {
  console.log(`Démarrage de la génération des fichiers d'audit pour ${namePrefix}...`);

  const wb = XLSX.utils.book_new();

  const ws_controls = XLSX.utils.json_to_sheet(controls);
  XLSX.utils.book_append_sheet(wb, ws_controls, "Controls");

  const summaryRows = [
    { Metrique: "TotalControls", Valeur: summary.TotalControls },
    { Metrique: "CriticalControls", Valeur: summary.CriticalControls },
    { Metrique: "ControlsWithoutProcedure", Valeur: summary.ControlsWithoutProcedure },
    { Metrique: "ExtractionDate", Valeur: summary.ExtractionDate }
  ];
  const ws_summary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws_summary, "Summary");

  const ws_checklist = XLSX.utils.json_to_sheet(checklist);
  XLSX.utils.book_append_sheet(wb, ws_checklist, "ChecklistByPage");

  const ws_commands = XLSX.utils.json_to_sheet(commands);
  XLSX.utils.book_append_sheet(wb, ws_commands, "Commands");

  const ws_log = XLSX.utils.json_to_sheet(logs);
  XLSX.utils.book_append_sheet(wb, ws_log, "ExtractionLog");

  if (!fs.existsSync("public")) {
    fs.mkdirSync("public");
  }

  const excelFileName = `CIS_${namePrefix}_Controls.xlsx`;
  XLSX.writeFile(wb, excelFileName);
  XLSX.writeFile(wb, `public/${excelFileName}`);
  console.log(`Fichier '${excelFileName}' enregistré avec succès.`);

  const csvFileName = `${namePrefix}_Controls.csv`;
  const csvContent = XLSX.utils.sheet_to_csv(ws_controls);
  fs.writeFileSync(csvFileName, csvContent, "utf8");
  fs.writeFileSync(`public/${csvFileName}`, csvContent, "utf8");
  console.log(`Fichier '${csvFileName}' exporté avec succès.`);

  const jsonFileName = `${namePrefix.toLowerCase()}_controls.json`;
  fs.writeFileSync(jsonFileName, JSON.stringify(controls, null, 2), "utf8");
  fs.writeFileSync(`public/${jsonFileName}`, JSON.stringify(controls, null, 2), "utf8");
  console.log(`Fichier '${jsonFileName}' exporté avec succès.`);
}

function main() {
  generateForProduct("Postgres15", controlsData, checklistByPageData, commandsData, extractionLogs, summaryData);
  // for backwards compatibility with the existing files that don't have Postgres15 prefix:
  // (We'll just copy them over)
  fs.copyFileSync("Postgres15_Controls.csv", "Controls.csv");
  fs.copyFileSync("public/Postgres15_Controls.csv", "public/Controls.csv");
  fs.copyFileSync("postgres15_controls.json", "controls.json");
  fs.copyFileSync("public/postgres15_controls.json", "public/controls.json");
  
  generateForProduct("MariaDB106", mariadbControlsData, mariadbChecklistByPageData, mariadbCommandsData, mariadbExtractionLogs, mariadbSummaryData);
  // The links in App.tsx are expecting specific filenames for MariaDB:
  fs.copyFileSync("MariaDB106_Controls.csv", "MariaDB_Controls.csv");
  fs.copyFileSync("public/MariaDB106_Controls.csv", "public/MariaDB_Controls.csv");
  fs.copyFileSync("mariadb106_controls.json", "mariadb_controls.json");
  fs.copyFileSync("public/mariadb106_controls.json", "public/mariadb_controls.json");

  generateForProduct("SQLServer2022", sqlserverControlsData, sqlserverChecklistByPageData, sqlserverCommandsData, sqlserverExtractionLogs, sqlserverSummaryData);
  fs.copyFileSync("SQLServer2022_Controls.csv", "public/SQLServer2022_Controls.csv");
  fs.copyFileSync("sqlserver2022_controls.json", "public/sqlserver_controls.json");
  fs.copyFileSync("sqlserver2022_controls.json", "sqlserver_controls.json");

  generateForProduct("Oracle19c", oracle19cControlsData, oracle19cChecklistByPageData, oracle19cCommandsData, oracle19cExtractionLogs, oracle19cSummaryData);
  fs.copyFileSync("Oracle19c_Controls.csv", "public/Oracle19c_Controls.csv");
  fs.copyFileSync("oracle19c_controls.json", "public/oracle19c_controls.json");
  fs.copyFileSync("oracle19c_controls.json", "oracle19c_controls.json");

  console.log("Génération terminée de tous les fichiers !");
}

main();
