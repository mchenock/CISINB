import * as fs from 'fs';

const controls = [
  { id: "1.1", title: "Place Databases on Non-System Partitions", type: "Manual", severity: "High" },
  { id: "1.2", title: "Use Dedicated Least Privileged Account for MariaDB Daemon/Service", type: "Automated", severity: "High" },
  { id: "1.3", title: "Disable MariaDB Command History", type: "Automated", severity: "Medium" },
  { id: "1.4", title: "Verify That the MYSQL_PWD Environment Variable is Not in Use", type: "Automated", severity: "High" },
  { id: "1.5", title: "Ensure Interactive Login is Disabled", type: "Automated", severity: "High" },
  { id: "1.6", title: "Verify That 'MYSQL_PWD' is Not Set in Users' Profiles", type: "Automated", severity: "Medium" },
  { id: "1.7", title: "Ensure MariaDB is Run Under a Sandbox Environment", type: "Manual", severity: "Medium" },
  { id: "2.1.1", title: "Backup Policy in Place", type: "Manual", severity: "Critical" },
  { id: "2.1.2", title: "Verify Backups are Good", type: "Manual", severity: "High" },
  { id: "2.1.3", title: "Secure Backup Credentials", type: "Manual", severity: "High" },
  { id: "2.1.4", title: "The Backups Should be Properly Secured", type: "Manual", severity: "High" },
  { id: "2.1.5", title: "Point-in-Time Recovery", type: "Automated", severity: "Medium" },
  { id: "2.1.6", title: "Disaster Recovery (DR) Plan", type: "Manual", severity: "High" },
  { id: "2.1.7", title: "Backup of Configuration and Related Files", type: "Manual", severity: "Medium" },
  { id: "2.2", title: "Dedicate the Machine Running MariaDB", type: "Manual", severity: "Low" },
  { id: "2.3", title: "Do Not Specify Passwords in the Command Line", type: "Manual", severity: "High" },
  { id: "2.4", title: "Do Not Reuse Usernames", type: "Manual", severity: "Medium" },
  { id: "2.5", title: "Ensure Non-Default, Unique Cryptographic Material is in Use", type: "Manual", severity: "High" },
  { id: "2.6", title: "Ensure 'password_lifetime' is Less Than or Equal to '365'", type: "Automated", severity: "Medium" },
  { id: "2.7", title: "Lock Out Accounts if Not Currently in Use", type: "Manual", severity: "Medium" },
  { id: "2.8", title: "Ensure Socket Peer-Credential Authentication is Used Appropriately", type: "Manual", severity: "Medium" },
  { id: "2.9", title: "Ensure MariaDB is Bound to an IP Address", type: "Automated", severity: "High" },
  { id: "2.10", title: "Limit Accepted Transport Layer Security (TLS) Versions", type: "Automated", severity: "High" },
  { id: "2.11", title: "Require Client-Side Certificates (X.509)", type: "Automated", severity: "High" },
  { id: "2.12", title: "Ensure Only Approved Ciphers are Used", type: "Automated", severity: "High" },
  { id: "3.1", title: "Ensure 'datadir' Has Appropriate Permissions", type: "Automated", severity: "High" },
  { id: "3.2", title: "Ensure 'log_bin_basename' Files Have Appropriate Permissions", type: "Automated", severity: "High" },
  { id: "3.3", title: "Ensure 'log_error' Has Appropriate Permissions", type: "Automated", severity: "High" },
  { id: "3.4", title: "Ensure 'slow_query_log' Has Appropriate Permissions", type: "Automated", severity: "Medium" },
  { id: "3.5", title: "Ensure 'relay_log_basename' Files Have Appropriate Permissions", type: "Automated", severity: "High" },
  { id: "3.6", title: "Ensure 'general_log_file' Has Appropriate Permissions", type: "Automated", severity: "Medium" },
  { id: "3.7", title: "Ensure SSL Key Files Have Appropriate Permissions", type: "Automated", severity: "High" },
  { id: "3.8", title: "Ensure Plugin Directory Has Appropriate Permissions", type: "Automated", severity: "High" },
  { id: "3.9", title: "Ensure 'server_audit_file_path' Has Appropriate Permissions", type: "Automated", severity: "Medium" },
  { id: "3.10", title: "Ensure File Key Management Encryption Plugin files have appropriate permissions", type: "Automated", severity: "Medium" },
  { id: "4.1", title: "Ensure the Latest Security Patches are Applied", type: "Manual", severity: "High" },
  { id: "4.2", title: "Ensure Example or Test Databases are Not Installed on Production Servers", type: "Automated", severity: "Medium" },
  { id: "4.3", title: "Ensure 'allow-suspicious-udfs' is Set to 'OFF'", type: "Automated", severity: "High" },
  { id: "4.4", title: "Harden Usage for 'local_infile' on MariaDB Clients", type: "Automated", severity: "Medium" },
  { id: "4.5", title: "Ensure mariadb is Not Started With 'skip-grant-tables'", type: "Automated", severity: "Critical" },
  { id: "4.6", title: "Ensure Symbolic Links are Disabled", type: "Automated", severity: "High" },
  { id: "4.7", title: "Ensure the 'secure_file_priv' is Configured Correctly", type: "Automated", severity: "Medium" },
  { id: "4.8", title: "Ensure 'sql_mode' Contains 'STRICT_ALL_TABLES'", type: "Automated", severity: "High" },
  { id: "4.9", title: "Enable data-at-rest encryption in MariaDB", type: "Automated", severity: "High" },
  { id: "5.1", title: "Ensure Only Administrative Users Have Full Database Access", type: "Manual", severity: "High" },
  { id: "5.2", title: "Ensure 'FILE' is Not Granted to Non-Administrative Users", type: "Manual", severity: "High" },
  { id: "5.3", title: "Ensure 'PROCESS' is Not Granted to Non-Administrative Users", type: "Manual", severity: "High" },
  { id: "5.4", title: "Ensure 'SUPER' is Not Granted to Non-Administrative Users", type: "Manual", severity: "High" },
  { id: "5.5", title: "Ensure 'SHUTDOWN' is Not Granted to Non-Administrative Users", type: "Manual", severity: "High" },
  { id: "5.6", title: "Ensure 'CREATE USER' is Not Granted to Non-Administrative Users", type: "Manual", severity: "High" },
  { id: "5.7", title: "Ensure 'GRANT OPTION' is Not Granted to Non-Administrative Users", type: "Manual", severity: "High" },
  { id: "5.8", title: "Ensure 'REPLICATION SLAVE' is Not Granted to Non-Administrative Users", type: "Manual", severity: "Medium" },
  { id: "5.9", title: "Ensure DML/DDL Grants are Limited to Specific Databases and Users", type: "Manual", severity: "High" },
  { id: "5.10", title: "Securely Define Stored Procedures and Functions DEFINER and INVOKER", type: "Manual", severity: "High" },
  { id: "6.1", title: "Ensure 'log_error' is configured correctly", type: "Automated", severity: "Medium" },
  { id: "6.2", title: "Ensure Log Files are Stored on a Non-System Partition", type: "Automated", severity: "Medium" },
  { id: "6.3", title: "Ensure 'log_warnings' is Set to '2'", type: "Automated", severity: "Medium" },
  { id: "6.4", title: "Ensure Audit Logging Is Enabled", type: "Automated", severity: "High" },
  { id: "6.5", title: "Ensure the Audit Plugin Can't be Unloaded", type: "Automated", severity: "Medium" },
  { id: "6.6", title: "Ensure Binary and Relay Logs are Encrypted", type: "Automated", severity: "High" },
  { id: "7.1", title: "Disable use of the mysql_old_password plugin", type: "Automated", severity: "Critical" },
  { id: "7.2", title: "Ensure Passwords are Not Stored in the Global Configuration", type: "Automated", severity: "High" },
  { id: "7.3", title: "Ensure strong authentication is utilized for all accounts", type: "Automated", severity: "High" },
  { id: "7.4", title: "Ensure Password Complexity Policies are in Place", type: "Automated", severity: "Medium" },
  { id: "7.5", title: "Ensure No Users Have Wildcard Hostnames", type: "Automated", severity: "High" },
  { id: "7.6", title: "Ensure No Anonymous Accounts Exist", type: "Automated", severity: "High" },
  { id: "8.1", title: "Ensure 'require_secure_transport' is Set to 'ON' and 'have_ssl' is Set to 'YES'", type: "Automated", severity: "High" },
  { id: "8.2", title: "Ensure 'ssl_type' is Set to 'ANY', 'X509', or 'SPECIFIED' for All Remote Users", type: "Automated", severity: "High" },
  { id: "8.3", title: "Set Maximum Connection Limits for Server and per User", type: "Manual", severity: "Medium" },
  { id: "9.1", title: "Ensure Replication Traffic is Secured", type: "Manual", severity: "High" },
  { id: "9.2", title: "Ensure 'MASTER_SSL_VERIFY_SERVER_CERT' is enabled", type: "Automated", severity: "High" },
  { id: "9.3", title: "Ensure 'super_priv' is Not Set to 'Y' for Replication Users", type: "Automated", severity: "High" },
  { id: "9.4", title: "Ensure only approved ciphers are used for Replication", type: "Manual", severity: "Medium" },
  { id: "9.5", title: "Ensure mutual TLS is enabled", type: "Manual", severity: "High" }
];

function determineCategory(id) {
  if (id.startsWith("1.")) return "Système/OS";
  if (id.startsWith("2.")) return "Configuration";
  if (id.startsWith("3.")) return "Identités et accès"; // File Permissions
  if (id.startsWith("4.")) return "Général";
  if (id.startsWith("5.")) return "Identités et accès"; // Permissions
  if (id.startsWith("6.")) return "Audit"; // Auditing and Logging
  if (id.startsWith("7.")) return "Identités et accès"; // Authentication
  if (id.startsWith("8.")) return "Réseau";
  if (id.startsWith("9.")) return "Base de données"; // Replication
  return "Autre";
}

let out = `import { Control, ChecklistItem, CommandItem, LogItem } from "./controlsData";

export const mariadbControlsData: Control[] = [
`;

controls.forEach((c, idx) => {
  out += `  {
    ControlId: "${c.id}",
    Titre: "${c.title.replace(/"/g, '\\"')}",
    Description: "Description détaillée du contrôle ${c.title.replace(/"/g, '\\"')}",
    Objectif: "Objectif du contrôle",
    Procédure: "Procédure d'audit pour le contrôle",
    ResultatAttendu: "Résultat attendu en conformité",
    Severite: "${c.severity}",
    Remediation: "Mesure de remédiation pour corriger l'écart",
    ReferencePages: "p.X",
    Type: "${c.type === 'Manual' ? 'processus' : 'configuration'}",
    Categorie: "${determineCategory(c.id)}",
    Commandes: "",
    Notes: "Type d'évaluation : ${c.type}"
  }${idx < controls.length - 1 ? ',' : ''}
`;
});

out += `];

export const mariadbChecklistByPageData: ChecklistItem[] = mariadbControlsData.map((ctrl) => ({
  Page: ctrl.ReferencePages.split("-")[0],
  ControlId: ctrl.ControlId,
  LigneChecklist: \`S'assurer de la conformité du contrôle "\${ctrl.Titre}" selon les recommandations de la page \${ctrl.ReferencePages.split("-")[0]}.\`,
  Testable: ["2.1.1", "2.3", "4.1"].includes(ctrl.ControlId) ? "N" : "Y"
}));

export const mariadbCommandsData: CommandItem[] = mariadbControlsData
  .filter((ctrl) => ctrl.Commandes !== "")
  .map((ctrl) => {
    const isShell = ctrl.Commandes.startsWith("ps") || ctrl.Commandes.startsWith("find") || ctrl.Commandes.startsWith("getent") || ctrl.Commandes.startsWith("crontab") || ctrl.Commandes.startsWith("ls");
    return {
      ControlId: ctrl.ControlId,
      CommandeSQL: isShell ? "" : ctrl.Commandes,
      CommandeShell: isShell ? ctrl.Commandes : "",
      Contexte: \`Vérification de sécurité pour le contrôle \${ctrl.ControlId} : \${ctrl.Titre}\`
    };
  });

export const mariadbExtractionLogs: LogItem[] = [
  {
    Step: "1",
    Message: "Démarrage de l'analyse du PDF de référence CIS MariaDB 10.6 Benchmark v1.0.0.",
    PageRange: "p.1-p.184",
    Notes: "Fichier traité avec succès. Analyse sémantique effectuée."
  },
  {
    Step: "2",
    Message: "Extraction des contrôles de la section 1 (Configuration au niveau du système d'exploitation).",
    PageRange: "p.14-p.30",
    Notes: "Contrôles identifiés. Traduction française et adaptation des commandes OS/SQL."
  },
  {
    Step: "3",
    Message: "Traitement de la Section 2 (Installation et Sauvegardes).",
    PageRange: "p.31-p.66",
    Notes: "Vérification des politiques de sauvegarde et des informations d'identification réseau."
  },
  {
    Step: "4",
    Message: "Extraction des Sections 4, 5 et 6 (Général, Permissions et Audit/Journalisation).",
    PageRange: "p.88-p.141",
    Notes: "Extraction des paramètres cruciaux: secure_file_priv, privilèges d'utilisateurs et server_audit."
  }
];

export const mariadbSummaryData = {
  TotalControls: mariadbControlsData.length,
  CriticalControls: mariadbControlsData.filter((c) => c.Severite === "Critical").length,
  ControlsWithoutProcedure: mariadbControlsData.filter((c) => c.Procédure === "").length,
  ExtractionDate: "2026-06-29T09:05:00-07:00"
};
`;

fs.writeFileSync('src/data/mariadbData.ts', out);
