import { useState, useMemo, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Database,
  Terminal,
  ShieldAlert,
  CheckSquare,
  History,
  BookOpen,
  RefreshCw,
  TrendingUp,
  FileClock,
  Shield,
  HelpCircle,
  Clock
} from "lucide-react";
import {
  controlsData as pgControlsData,
  checklistByPageData as pgChecklistByPageData,
  commandsData as pgCommandsData,
  extractionLogs as pgExtractionLogs,
  summaryData as pgSummaryData,
  Control
} from "./data/controlsData";
import {
  mariadbControlsData,
  mariadbChecklistByPageData,
  mariadbCommandsData,
  mariadbExtractionLogs,
  mariadbSummaryData
} from "./data/mariadbData";
import {
  sqlserverControlsData,
  sqlserverChecklistByPageData,
  sqlserverCommandsData,
  sqlserverExtractionLogs,
  sqlserverSummaryData
} from "./data/sqlserverData";
import {
  oracle19cControlsData,
  oracle19cChecklistByPageData,
  oracle19cCommandsData,
  oracle19cExtractionLogs,
  oracle19cSummaryData
} from "./data/oracle19cData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function App() {
  const [currentBenchmark, setCurrentBenchmark] = useState<"postgres" | "mariadb" | "sqlserver" | "oracle19c">("postgres");

  const controlsData = useMemo(() => {
    if (currentBenchmark === "postgres") return pgControlsData;
    if (currentBenchmark === "mariadb") return mariadbControlsData;
    if (currentBenchmark === "oracle19c") return oracle19cControlsData;
    return sqlserverControlsData;
  }, [currentBenchmark]);

  const checklistByPageData = useMemo(() => {
    if (currentBenchmark === "postgres") return pgChecklistByPageData;
    if (currentBenchmark === "mariadb") return mariadbChecklistByPageData;
    if (currentBenchmark === "oracle19c") return oracle19cChecklistByPageData;
    return sqlserverChecklistByPageData;
  }, [currentBenchmark]);

  const commandsData = useMemo(() => {
    if (currentBenchmark === "postgres") return pgCommandsData;
    if (currentBenchmark === "mariadb") return mariadbCommandsData;
    if (currentBenchmark === "oracle19c") return oracle19cCommandsData;
    return sqlserverCommandsData;
  }, [currentBenchmark]);

  const extractionLogs = useMemo(() => {
    if (currentBenchmark === "postgres") return pgExtractionLogs;
    if (currentBenchmark === "mariadb") return mariadbExtractionLogs;
    if (currentBenchmark === "oracle19c") return oracle19cExtractionLogs;
    return sqlserverExtractionLogs;
  }, [currentBenchmark]);

  const summaryData = useMemo(() => {
    if (currentBenchmark === "postgres") return pgSummaryData;
    if (currentBenchmark === "mariadb") return mariadbSummaryData;
    if (currentBenchmark === "oracle19c") return oracle19cSummaryData;
    return sqlserverSummaryData;
  }, [currentBenchmark]);

  const [activeTab, setActiveTab] = useState<"dashboard" | "controls" | "commands" | "checklist" | "logs">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [expandedControlId, setExpandedControlId] = useState<string | null>(null);
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);

  // States for user interactive checklist (local state tracker)
  const [pgChecklistStates, setPgChecklistStates] = useState<Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">>(
    pgControlsData.reduce((acc, ctrl) => {
      acc[ctrl.ControlId] = ctrl.ControlId === "9.1" ? "VERIFY" : "PENDING";
      return acc;
    }, {} as Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">)
  );

  const [mariadbChecklistStates, setMariadbChecklistStates] = useState<Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">>(
    mariadbControlsData.reduce((acc, ctrl) => {
      acc[ctrl.ControlId] = ctrl.ControlId === "9.1" ? "VERIFY" : "PENDING";
      return acc;
    }, {} as Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">)
  );

  const [sqlserverChecklistStates, setSqlserverChecklistStates] = useState<Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">>(
    sqlserverControlsData.reduce((acc, ctrl) => {
      acc[ctrl.ControlId] = "PENDING";
      return acc;
    }, {} as Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">)
  );

  const [oracle19cChecklistStates, setOracle19cChecklistStates] = useState<Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">>(
    oracle19cControlsData.reduce((acc, ctrl) => {
      acc[ctrl.ControlId] = "PENDING";
      return acc;
    }, {} as Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">)
  );

  const checklistStates = currentBenchmark === "postgres" 
    ? pgChecklistStates 
    : currentBenchmark === "mariadb" 
      ? mariadbChecklistStates 
      : currentBenchmark === "oracle19c"
        ? oracle19cChecklistStates
        : sqlserverChecklistStates;

  const setChecklistStates = currentBenchmark === "postgres"
    ? setPgChecklistStates
    : currentBenchmark === "mariadb"
      ? setMariadbChecklistStates
      : currentBenchmark === "oracle19c"
        ? setOracle19cChecklistStates
        : setSqlserverChecklistStates;

  // States to track the output/evidence text from imported JSON
  const [pgChecklistOutputs, setPgChecklistOutputs] = useState<Record<string, string>>({});
  const [mariadbChecklistOutputs, setMariadbChecklistOutputs] = useState<Record<string, string>>({});
  const [sqlserverChecklistOutputs, setSqlserverChecklistOutputs] = useState<Record<string, string>>({});
  const [oracle19cChecklistOutputs, setOracle19cChecklistOutputs] = useState<Record<string, string>>({});

  const checklistOutputs = currentBenchmark === "postgres" 
    ? pgChecklistOutputs 
    : currentBenchmark === "mariadb" 
      ? mariadbChecklistOutputs 
      : currentBenchmark === "oracle19c"
        ? oracle19cChecklistOutputs
        : sqlserverChecklistOutputs;

  const setChecklistOutputs = currentBenchmark === "postgres"
    ? setPgChecklistOutputs
    : currentBenchmark === "mariadb"
      ? setMariadbChecklistOutputs
      : currentBenchmark === "oracle19c"
        ? setOracle19cChecklistOutputs
        : setSqlserverChecklistOutputs;

  // Handle Copy command text
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommandId(id);
    setTimeout(() => setCopiedCommandId(null), 2000);
  };

  // Filtered Controls
  const filteredControls = useMemo(() => {
    return controlsData.filter((ctrl) => {
      const matchesSearch =
        ctrl.ControlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.Titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.Remediation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = selectedSeverity === "All" || ctrl.Severite === selectedSeverity;
      const matchesCategory = selectedCategory === "All" || ctrl.Categorie === selectedCategory;
      const matchesType = selectedType === "All" || ctrl.Type === selectedType;

      return matchesSearch && matchesSeverity && matchesCategory && matchesType;
    });
  }, [searchQuery, selectedSeverity, selectedCategory, selectedType, controlsData]);

  // Chart Data preparation
  const severityChartData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    controlsData.forEach((ctrl) => {
      if (ctrl.Severite && ctrl.Severite in counts) {
        counts[ctrl.Severite as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [controlsData]);

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    controlsData.forEach((ctrl) => {
      if (ctrl.Categorie) {
        counts[ctrl.Categorie] = (counts[ctrl.Categorie] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [controlsData]);

  const SEVERITY_COLORS = {
    Critical: "#ef4444", // red
    High: "#f97316",     // orange
    Medium: "#eab308",   // yellow
    Low: "#3b82f6",      // blue
  };

  const CATEGORY_COLORS = ["#475569", "#64748b", "#334155", "#1e293b", "#0f172a", "#94a3b8", "#cbd5e1"];

  // Compliance metrics based on interactive checklist
  const complianceStats = useMemo(() => {
    const total = controlsData.length;
    const passed = Object.values(checklistStates).filter((s) => s === "PASSED").length;
    const failed = Object.values(checklistStates).filter((s) => s === "FAILED").length;
    const na = Object.values(checklistStates).filter((s) => s === "NA").length;
    const verify = Object.values(checklistStates).filter((s) => s === "VERIFY").length;
    const pending = Object.values(checklistStates).filter((s) => s === "PENDING").length;

    // We don't count N/A in the percentage
    const activeTotal = total - na;
    const score = activeTotal > 0 ? Math.round((passed / activeTotal) * 100) : 0;

    return { total, passed, failed, na, verify, pending, score };
  }, [checklistStates, controlsData]);

  const updateChecklistState = (controlId: string, state: "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY") => {
    setChecklistStates((prev) => ({ ...prev, [controlId]: state }));
  };

  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleJsonUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        const json = JSON.parse(fileContent);
        if (!Array.isArray(json)) {
          throw new Error("Le format du fichier doit être un tableau JSON.");
        }

        const newState = { ...checklistStates };
        const newOutputs = { ...checklistOutputs };
        let updatedCount = 0;

        json.forEach((item: any) => {
          if (item.id && item.status) {
            if (["PASSED", "FAILED", "VERIFY", "NA", "PENDING"].includes(item.status)) {
              newState[item.id] = item.status;
              updatedCount++;
            }
          }
          if (item.id) {
            if (item.value !== undefined) {
              newOutputs[item.id] = String(item.value);
            } else if (item.output !== undefined) {
              newOutputs[item.id] = String(item.output);
            }
          }
        });

        if (updatedCount === 0) {
          throw new Error("Aucun statut de contrôle valide n'a été trouvé dans le fichier.");
        }

        setChecklistStates(newState);
        setChecklistOutputs(newOutputs);
        setImportStatus({
          type: "success",
          message: `${updatedCount} statuts de contrôles et évidences (outputs) importés avec succès depuis le fichier d'audit !`
        });
        setTimeout(() => setImportStatus(null), 6000);
      } catch (err: any) {
        setImportStatus({
          type: "error",
          message: `Échec de l'importation : ${err.message || "Fichier invalide"}`
        });
        setTimeout(() => setImportStatus(null), 6000);
      }
    };
    reader.readAsText(file);
  };

  const handleExportXLSX = () => {
    const exportData = controlsData.map(control => {
      const status = checklistStates[control.ControlId] || "VERIFY";
      const evidence = checklistOutputs[control.ControlId] || "";
      return {
        "ID Contrôle": control.ControlId,
        "Titre": control.Titre,
        "Sévérité": control.Severite,
        "Catégorie": control.Categorie,
        "Statut": status,
        "Valeur Actuelle / Évidence (Output)": evidence,
        "Notes d'évaluation": "", // Espace pour commentaires éventuels
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Résultats de l'audit");
    
    XLSX.writeFile(wb, `audit-result-${currentBenchmark}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" id="app_container">
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm" id="main_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-slate-700" id="shield_icon" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900" id="app_title">
                  {currentBenchmark === "postgres" 
                    ? "CIS PostgreSQL 15 Audit Portal" 
                    : currentBenchmark === "mariadb" 
                      ? "CIS MariaDB 10.6 Audit Portal" 
                      : currentBenchmark === "oracle19c"
                        ? "CIS Oracle 19c Audit Portal"
                        : "CIS SQL Server 2022 Audit Portal"}
                </h1>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                  {currentBenchmark === "postgres" ? "v1.2.0" : currentBenchmark === "mariadb" ? "v1.0.0" : currentBenchmark === "oracle19c" ? "v2.0.0" : "v1.3.0"}
                </span>
                
                <div className="ml-4">
                  <select 
                    value={currentBenchmark} 
                    onChange={(e) => setCurrentBenchmark(e.target.value as "postgres" | "mariadb" | "sqlserver" | "oracle19c")}
                    className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 shadow-sm"
                  >
                    <option value="postgres">PostgreSQL 15</option>
                    <option value="mariadb">MariaDB 10.6</option>
                    <option value="sqlserver">SQL Server 2022</option>
                    <option value="oracle19c">Oracle 19c</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1" id="app_tagline">
                Outil interactif de conformité sécurité, de génération de rapports et d'audit technique.
              </p>
            </div>

            {/* DOWNLOAD PANEL */}
            <div className="flex flex-wrap gap-2 items-center" id="download_panel">
              {currentBenchmark === "postgres" && (
                <>
                  <a
                    href="/audit_postgres15.sh"
                    download="audit_postgres15.sh"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_bash"
                    title="Télécharger le script d'audit automatisé Bash"
                  >
                    <Terminal className="h-4 w-4" />
                    <span>Script d'audit (.sh)</span>
                  </a>

                  <a
                    href="/AUDIT_PROCEDURE.md"
                    download="AUDIT_PROCEDURE.md"
                    className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_procedure"
                    title="Télécharger le guide de procédure d'audit complet en Markdown"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Guide Procédure (.md)</span>
                  </a>

                  <a
                    href="/CIS_Postgres15_Controls.xlsx"
                    download="CIS_Postgres15_Controls.xlsx"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_excel"
                    title="Télécharger le fichier Excel officiel complet"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Format Excel (.xlsx)</span>
                  </a>

                  <a
                    href="/Controls.csv"
                    download="Controls.csv"
                    className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_csv"
                    title="Télécharger la table principale en CSV"
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV (.csv)</span>
                  </a>

                  <a
                    href="/controls.json"
                    download="controls.json"
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_json"
                    title="Télécharger la structure de données JSON"
                  >
                    <FileCode className="h-4 w-4" />
                    <span>JSON (.json)</span>
                  </a>
                </>
              )}
              {currentBenchmark === "mariadb" && (
                <>
                  <a
                    href="/audit_mariadb106.sh"
                    download="audit_mariadb106.sh"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_bash_mariadb"
                    title="Télécharger le script d'audit automatisé Bash"
                  >
                    <Terminal className="h-4 w-4" />
                    <span>Script d'audit (.sh)</span>
                  </a>

                  <a
                    href="/AUDIT_PROCEDURE_MARIADB.md"
                    download="AUDIT_PROCEDURE_MARIADB.md"
                    className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_procedure_mariadb"
                    title="Télécharger le guide de procédure d'audit complet en Markdown"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Guide Procédure (.md)</span>
                  </a>

                  <a
                    href="/CIS_MariaDB106_Controls.xlsx"
                    download="CIS_MariaDB106_Controls.xlsx"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_excel_mariadb"
                    title="Télécharger le fichier Excel officiel complet"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Format Excel (.xlsx)</span>
                  </a>

                  <a
                    href="/MariaDB_Controls.csv"
                    download="MariaDB_Controls.csv"
                    className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_csv_mariadb"
                    title="Télécharger la table principale en CSV"
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV (.csv)</span>
                  </a>

                  <a
                    href="/mariadb_controls.json"
                    download="mariadb_controls.json"
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_json_mariadb"
                    title="Télécharger la structure de données JSON"
                  >
                    <FileCode className="h-4 w-4" />
                    <span>JSON (.json)</span>
                  </a>
                </>
              )}
              {currentBenchmark === "sqlserver" && (
                <>
                  <a
                    href="/audit_sqlserver2022.sql"
                    download="audit_sqlserver2022.sql"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_sql_sqlserver"
                    title="Télécharger le script d'audit T-SQL"
                  >
                    <Terminal className="h-4 w-4" />
                    <span>Script d'audit (.sql)</span>
                  </a>

                  <a
                    href="/AUDIT_PROCEDURE_SQLSERVER.md"
                    download="AUDIT_PROCEDURE_SQLSERVER.md"
                    className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_procedure_sqlserver"
                    title="Télécharger le guide de procédure d'audit complet en Markdown"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Guide Procédure (.md)</span>
                  </a>

                  <a
                    href="/CIS_SQLServer2022_Controls.xlsx"
                    download="CIS_SQLServer2022_Controls.xlsx"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_excel_sqlserver"
                    title="Télécharger le fichier Excel officiel complet"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Format Excel (.xlsx)</span>
                  </a>

                  <a
                    href="/SQLServer2022_Controls.csv"
                    download="SQLServer2022_Controls.csv"
                    className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_csv_sqlserver"
                    title="Télécharger la table principale en CSV"
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV (.csv)</span>
                  </a>

                  <a
                    href="/sqlserver_controls.json"
                    download="sqlserver_controls.json"
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_json_sqlserver"
                    title="Télécharger la structure de données JSON"
                  >
                    <FileCode className="h-4 w-4" />
                    <span>JSON (.json)</span>
                  </a>
                </>
              )}
              {currentBenchmark === "oracle19c" && (
                <>
                  <a
                    href="/audit_oracle19c.sql"
                    download="audit_oracle19c.sql"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_sql_oracle"
                    title="Télécharger le script d'audit SQL"
                  >
                    <Terminal className="h-4 w-4" />
                    <span>Script d'audit (.sql)</span>
                  </a>

                  <a
                    href="/AUDIT_PROCEDURE_ORACLE19C.md"
                    download="AUDIT_PROCEDURE_ORACLE19C.md"
                    className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_procedure_oracle"
                    title="Télécharger le guide de procédure d'audit complet en Markdown"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Guide Procédure (.md)</span>
                  </a>

                  <a
                    href="/CIS_Oracle19c_Controls.xlsx"
                    download="CIS_Oracle19c_Controls.xlsx"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_excel_oracle"
                    title="Télécharger le fichier Excel officiel complet"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Format Excel (.xlsx)</span>
                  </a>

                  <a
                    href="/Oracle19c_Controls.csv"
                    download="Oracle19c_Controls.csv"
                    className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_csv_oracle"
                    title="Télécharger la table principale en CSV"
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV (.csv)</span>
                  </a>

                  <a
                    href="/oracle19c_controls.json"
                    download="oracle19c_controls.json"
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    id="btn_download_json_oracle"
                    title="Télécharger la structure de données JSON"
                  >
                    <FileCode className="h-4 w-4" />
                    <span>JSON (.json)</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* MAIN TABS */}
          <div className="flex border-b border-slate-200 mt-6 -mb-4" id="navigation_tabs">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "dashboard"
                  ? "border-slate-800 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
              id="tab_dashboard"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Tableau de bord</span>
            </button>
            <button
              onClick={() => setActiveTab("controls")}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "controls"
                  ? "border-slate-800 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
              id="tab_controls"
            >
              <Database className="h-4 w-4" />
              <span>Base des contrôles ({filteredControls.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("commands")}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "commands"
                  ? "border-slate-800 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
              id="tab_commands"
            >
              <Terminal className="h-4 w-4" />
              <span>Commandes d'audit</span>
            </button>
            <button
              onClick={() => setActiveTab("checklist")}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "checklist"
                  ? "border-slate-800 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
              id="tab_checklist"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Checklist interactive</span>
              {complianceStats.score > 0 && (
                <span className="ml-1 bg-slate-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {complianceStats.score}%
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "logs"
                  ? "border-slate-800 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
              id="tab_logs"
            >
              <History className="h-4 w-4" />
              <span>Journal d'extraction</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT REGION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main_content_area">
        <AnimatePresence mode="wait">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
              id="dashboard_view"
            >
              {/* COMPLIANCE ALERT & SCORE BAR */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-2xl">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="text-slate-700 h-5 w-5" />
                    <span>Progression globale de l'audit de sécurité</span>
                  </h3>
                  <p className="text-sm text-slate-500">
                    Utilisez l'onglet <strong>Checklist interactive</strong> pour évaluer la configuration de votre instance PostgreSQL 15. Votre score est mis à jour dynamiquement ci-dessous.
                  </p>
                </div>
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">CONFORMITÉ</span>
                      <span className="text-slate-900">{complianceStats.score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-slate-700 h-full rounded-full transition-all duration-500"
                        style={{ width: `${complianceStats.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-slate-800 text-white h-14 w-14 rounded-xl flex flex-col items-center justify-center border border-slate-700 shadow-md">
                    <span className="text-lg font-bold leading-none">{complianceStats.score}</span>
                    <span className="text-[9px] font-medium tracking-wider uppercase mt-1">Score</span>
                  </div>
                </div>
              </div>

              {/* SUMMARY STAT CARDS (BENTO) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="bento_statistics">
                {/* Total controls */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-700">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total des contrôles</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{summaryData.TotalControls}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Identifiés et formalisés</p>
                  </div>
                </div>

                {/* Critical controls */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-red-600">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Contrôles Critiques</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{summaryData.CriticalControls}</p>
                    <p className="text-xs text-red-500 mt-0.5">À corriger en priorité</p>
                  </div>
                </div>

                {/* Controls without procedure */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-600">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sans Procédure Tech</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{summaryData.ControlsWithoutProcedure}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Revue de doc uniquement</p>
                  </div>
                </div>

                {/* Extraction date */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-700">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date d'extraction</p>
                    <p className="text-base font-bold text-slate-900 mt-1">29 Juin 2026</p>
                    <p className="text-xs text-slate-500 mt-1">Conformité ISO 8601</p>
                  </div>
                </div>
              </div>

              {/* COMPLIANCE MATRIX PROGRESS */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="compliance_matrix">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Détail par statut</h4>
                  <div className="space-y-3.5">
                    {/* Passed */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                        <span className="text-sm font-medium text-slate-700">Conforme (Passed)</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {complianceStats.passed}
                      </span>
                    </div>

                    {/* Failed */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500"></span>
                        <span className="text-sm font-medium text-slate-700">Non conforme (Failed)</span>
                      </div>
                      <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {complianceStats.failed}
                      </span>
                    </div>

                    {/* Verify */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                        <span className="text-sm font-medium text-slate-700">À valider ([A VERIFIER])</span>
                      </div>
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {complianceStats.verify}
                      </span>
                    </div>

                    {/* NA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-400"></span>
                        <span className="text-sm font-medium text-slate-700">Non Applicable (N/A)</span>
                      </div>
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {complianceStats.na}
                      </span>
                    </div>

                    {/* Pending */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-200"></span>
                        <span className="text-sm font-medium text-slate-700">Non Évalué</span>
                      </div>
                      <span className="bg-slate-50 text-slate-500 border border-slate-150 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {complianceStats.pending}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-400">
                    <span>Mise à jour en temps réel</span>
                    <button
                      onClick={() => {
                        if (confirm("Réinitialiser tous les statuts d'évaluation ?")) {
                          setChecklistStates(
                            controlsData.reduce((acc, ctrl) => {
                              acc[ctrl.ControlId] = ctrl.ControlId === "9.1" ? "VERIFY" : "PENDING";
                              return acc;
                            }, {} as Record<string, "PENDING" | "PASSED" | "FAILED" | "NA" | "VERIFY">)
                          );
                        }
                      }}
                      className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Réinitialiser</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-3 text-white flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Conseil de conformité
                    </span>
                    <h4 className="text-lg font-bold text-white mt-2">Comment durcir PostgreSQL 15</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      PostgreSQL 15 introduit des améliorations significatives de sécurité par défaut (notamment la révocation du privilège de création de table PUBLIC par défaut sur le schéma public). 
                      Assurez-vous de migrer les hachages de mots de passe de <code className="bg-slate-800 px-1 py-0.5 rounded text-red-400 text-xs font-mono">md5</code> vers <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400 text-xs font-mono">scram-sha-256</code> pour garantir la conformité au benchmark CIS PostgreSQL 15 v1.2.0.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("controls")}
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors w-full"
                  >
                    <span>Lancer l'audit de conformité</span>
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </button>
                </div>
              </div>

              {/* CHARTS GRAPHICS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard_charts">
                {/* Chart 1: Severities */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <ShieldAlert className="text-slate-600 h-5 w-5" />
                      <span>Répartition par Sévérité</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">Contrôles extraits</span>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                          {severityChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || "#475569"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Categories */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Database className="text-slate-600 h-5 w-5" />
                      <span>Répartition par Catégorie</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">Catégorisation CIS</span>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{ fontSize: "10px", marginTop: "10px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CONTROLS TABLE */}
          {activeTab === "controls" && (
            <motion.div
              key="controls_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
              id="controls_registry_view"
            >
              {/* FILTERS AND SEARCH */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4" id="filters_panel">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Rechercher par ID, Titre, Description, Commande ou Rédiation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-800 text-sm transition-colors"
                      id="input_search_controls"
                    />
                  </div>

                  {/* Severity Filter */}
                  <div className="w-full md:w-[200px]">
                    <div className="relative">
                      <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                        className="w-full py-2.5 pl-3 pr-8 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-800 text-sm appearance-none bg-white font-medium"
                        id="filter_severity"
                      >
                        <option value="All">Toutes Sévérités</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none h-4 w-4" />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="w-full md:w-[200px]">
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full py-2.5 pl-3 pr-8 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-800 text-sm appearance-none bg-white font-medium"
                        id="filter_category"
                      >
                        <option value="All">Toutes Catégories</option>
                        <option value="Base de données">Base de données</option>
                        <option value="Système/OS">Système/OS</option>
                        <option value="Réseau">Réseau</option>
                        <option value="Identités et accès">Identités et accès</option>
                        <option value="Organisationnel">Organisationnel</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none h-4 w-4" />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div className="w-full md:w-[150px]">
                    <div className="relative">
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full py-2.5 pl-3 pr-8 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-800 text-sm appearance-none bg-white font-medium"
                        id="filter_type"
                      >
                        <option value="All">Tous Types</option>
                        <option value="configuration">configuration</option>
                        <option value="processus">processus</option>
                        <option value="documentation">documentation</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Reset Filters Link */}
                {(searchQuery || selectedSeverity !== "All" || selectedCategory !== "All" || selectedType !== "All") && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedSeverity("All");
                        setSelectedCategory("All");
                        setSelectedType("All");
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors underline"
                      id="btn_reset_filters"
                    >
                      Réinitialiser tous les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* LIST OF CONTROLS */}
              <div className="space-y-4" id="controls_list">
                {filteredControls.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
                    <AlertTriangle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="font-medium text-slate-700">Aucun contrôle ne correspond à votre recherche.</p>
                    <p className="text-xs mt-1">Essayez d'élargir vos termes de recherche ou de réinitialiser vos filtres.</p>
                  </div>
                ) : (
                  filteredControls.map((ctrl) => {
                    const isExpanded = expandedControlId === ctrl.ControlId;
                    const evalState = checklistStates[ctrl.ControlId];

                    return (
                      <div
                        key={ctrl.ControlId}
                        className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
                          isExpanded ? "border-slate-800 ring-1 ring-slate-800" : "border-slate-200 hover:border-slate-300"
                        }`}
                        id={`control_row_${ctrl.ControlId}`}
                      >
                        {/* CONTROL ACCORDION HEADER */}
                        <div
                          onClick={() => setExpandedControlId(isExpanded ? null : ctrl.ControlId)}
                          className="p-5 flex items-start gap-4 cursor-pointer select-none"
                        >
                          {/* Severity Indicator */}
                          <div className="mt-0.5 min-w-[70px]">
                            <span
                              className="text-[10px] font-bold px-2 py-1 rounded-md border tracking-wider block text-center uppercase"
                              style={{
                                backgroundColor: `${SEVERITY_COLORS[ctrl.Severite as keyof typeof SEVERITY_COLORS] || "#f1f5f9"}15`,
                                borderColor: SEVERITY_COLORS[ctrl.Severite as keyof typeof SEVERITY_COLORS] || "#cbd5e1",
                                color: SEVERITY_COLORS[ctrl.Severite as keyof typeof SEVERITY_COLORS] || "#475569"
                              }}
                            >
                              {ctrl.Severite || "N/A"}
                            </span>
                          </div>

                          {/* Title & Info */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-500 font-mono tracking-tight">
                                {ctrl.ControlId}
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                {ctrl.Titre}
                              </h3>
                              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.2 rounded font-medium">
                                {ctrl.Categorie}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 md:line-clamp-1">
                              {ctrl.Description}
                            </p>
                          </div>

                          {/* Quick checklist assessment status */}
                          <div className="hidden sm:flex items-center gap-2">
                            {evalState === "PASSED" && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                                Conforme
                              </span>
                            )}
                            {evalState === "FAILED" && (
                              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
                                Non conforme
                              </span>
                            )}
                            {evalState === "VERIFY" && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                                A vérifier
                              </span>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="text-slate-400 mt-0.5">
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>

                        {/* EXPANDABLE BODY */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                            >
                              <div className="p-6 space-y-6 text-sm">
                                {/* Grid with basic details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Left: Metadata */}
                                  <div className="space-y-4 md:col-span-1">
                                    <div>
                                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                        Type de contrôle
                                      </span>
                                      <span className="text-slate-700 font-medium capitalize text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-md inline-block mt-1">
                                        {ctrl.Type}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                        Pages de référence
                                      </span>
                                      <span className="text-slate-700 font-medium text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-md inline-block mt-1">
                                        {ctrl.ReferencePages}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                        État d'évaluation
                                      </span>
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        <button
                                          onClick={() => updateChecklistState(ctrl.ControlId, "PASSED")}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                                            evalState === "PASSED"
                                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                              : "bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50"
                                          }`}
                                        >
                                          Conforme
                                        </button>
                                        <button
                                          onClick={() => updateChecklistState(ctrl.ControlId, "FAILED")}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                                            evalState === "FAILED"
                                              ? "bg-red-600 text-white border-red-600 shadow-sm"
                                              : "bg-white text-red-700 border-slate-200 hover:bg-red-50"
                                          }`}
                                        >
                                          Échec
                                        </button>
                                        <button
                                          onClick={() => updateChecklistState(ctrl.ControlId, "VERIFY")}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                                            evalState === "VERIFY"
                                              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                              : "bg-white text-amber-700 border-slate-200 hover:bg-amber-50"
                                          }`}
                                        >
                                          A vérifier
                                        </button>
                                        <button
                                          onClick={() => updateChecklistState(ctrl.ControlId, "NA")}
                                          className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                                            evalState === "NA"
                                              ? "bg-slate-600 text-white border-slate-600 shadow-sm"
                                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                          }`}
                                        >
                                          N/A
                                        </button>
                                      </div>
                                    </div>

                                    {ctrl.Notes && (
                                      <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                          Notes / Statut d'extraction
                                        </span>
                                        <p className="text-xs text-slate-500 italic mt-1 font-medium bg-white p-2 rounded border border-slate-150">
                                          {ctrl.Notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right: Functional Details */}
                                  <div className="space-y-4 md:col-span-2">
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Info className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Objectif du Contrôle</span>
                                      </h4>
                                      <p className="text-xs text-slate-600 leading-relaxed">
                                        {ctrl.Objectif}
                                      </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Procédure de vérification d'audit</span>
                                      </h4>
                                      <p className="text-xs text-slate-700 leading-relaxed">
                                        {ctrl.Procédure || "Aucune procédure technique automatisée (Revue de documentation ou de processus uniquement)."}
                                      </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Résultat attendu / Condition de conformité</span>
                                      </h4>
                                      <p className="text-xs text-slate-700 font-semibold bg-emerald-50 text-emerald-900 px-2.5 py-1.5 rounded border border-emerald-100">
                                        {ctrl.ResultatAttendu}
                                      </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                                        <span>Remédiation / Recommandations de durcissement</span>
                                      </h4>
                                      <p className="text-xs text-slate-600 leading-relaxed">
                                        {ctrl.Remediation}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom: Commands Block */}
                                {ctrl.Commandes && (
                                  <div className="space-y-2 border-t border-slate-200 pt-4">
                                    <div className="flex justify-between items-center">
                                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="h-4 w-4 text-slate-500" />
                                        <span>Script / Commandes de test d'audit</span>
                                      </h4>
                                      <button
                                        onClick={() => handleCopy(ctrl.Commandes, ctrl.ControlId)}
                                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-sm hover:bg-slate-50"
                                      >
                                        {copiedCommandId === ctrl.ControlId ? (
                                          <>
                                            <Check className="h-3 w-3 text-emerald-600" />
                                            <span className="text-emerald-700">Copié !</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3" />
                                            <span>Copier la commande</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <div className="bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                                      <code>{ctrl.Commandes}</code>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: COMMANDS HUB */}
          {activeTab === "commands" && (
            <motion.div
              key="commands_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
              id="commands_hub_view"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="text-slate-700 h-5 w-5" />
                  <span>Terminal de scripts d'audit de conformité</span>
                </h3>
                <p className="text-sm text-slate-500">
                  Cette console regroupe l'intégralité des commandes SQL d'interrogation système, ainsi que les instructions shell pour valider les droits physiques de l'OS. Copiez-les et exécutez-les sur vos instances PostgreSQL 15.
                </p>
              </div>

              {/* GRID OF COMMANDS */}
              <div className="grid grid-cols-1 gap-6" id="commands_grid">
                {commandsData.map((cmd) => (
                  <div key={cmd.ControlId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    {/* Header */}
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded font-mono">
                          ID {cmd.ControlId}
                        </span>
                        <span className="text-xs font-medium text-slate-500 italic">
                          {cmd.Contexte}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {cmd.CommandeSQL ? "SQL" : "Shell OS"}
                        </span>
                      </div>
                    </div>

                    {/* Command Content */}
                    <div className="p-5 flex-1 space-y-4">
                      <div className="relative">
                        <button
                          onClick={() => handleCopy(cmd.CommandeSQL || cmd.CommandeShell, cmd.ControlId)}
                          className="absolute right-3 top-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white p-1.5 rounded transition-all shadow"
                        >
                          {copiedCommandId === cmd.ControlId ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <pre className="bg-slate-950 text-slate-100 p-5 rounded-lg font-mono text-xs overflow-x-auto border border-slate-900 shadow-inner">
                          <code>{cmd.CommandeSQL || cmd.CommandeShell}</code>
                        </pre>
                      </div>

                      {/* Associated Control details */}
                      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-start gap-2">
                        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Condition attendue :</strong> {controlsData.find((c) => c.ControlId === cmd.ControlId)?.ResultatAttendu}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: CHECKLIST INTERACTIVE */}
          {activeTab === "checklist" && (
            <motion.div
              key="checklist_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
              id="interactive_checklist_view"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex-1 min-w-[280px]">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="text-slate-700 h-5 w-5" />
                      <span>Matrice d'évaluation des contrôles de conformité</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Cochez au fur et à mesure de votre audit pour documenter l'état de votre architecture ou <strong>importez directement le fichier JSON généré par le script Bash</strong> pour remplir l'interface automatiquement !
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm" id="label_upload_json">
                      <Upload className="h-4 w-4" />
                      <span>Importer audit_result.json</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleJsonUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleExportXLSX}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                      title="Exporter les résultats actuels au format Excel"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Exporter audit_result.xlsx</span>
                    </button>
                    <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-4">
                      <span className="text-xs font-semibold text-slate-500">CONFORME :</span>
                      <span className="text-lg font-bold text-slate-800">{complianceStats.passed} / {complianceStats.total - complianceStats.na}</span>
                    </div>
                  </div>
                </div>

                {importStatus && (
                  <div
                    className={`p-4 rounded-lg text-xs font-medium border ${
                      importStatus.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {importStatus.message}
                  </div>
                )}
              </div>

              {/* LIST OF CHECKLIST ITEMS */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="checklist_table_panel">
                <table className="w-full text-left border-collapse" id="checklist_table">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                      <th className="py-4 px-6 w-[80px]">Page</th>
                      <th className="py-4 px-4 w-[100px]">ID</th>
                      <th className="py-4 px-4">Élément de checklist d'audit</th>
                      <th className="py-4 px-4 w-[120px] text-center">Testable</th>
                      <th className="py-4 px-6 w-[250px] text-right">Évaluation du statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {checklistByPageData.map((item) => {
                      const ctrl = controlsData.find((c) => c.ControlId === item.ControlId);
                      const currentState = checklistStates[item.ControlId];

                      return (
                        <tr key={item.ControlId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-500 font-mono">
                            {item.Page}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 font-mono">
                            {item.ControlId}
                          </td>
                          <td className="py-4 px-4 space-y-1">
                            <span className="font-semibold text-slate-800 block">
                              {ctrl?.Titre}
                            </span>
                            <span className="text-xs text-slate-400 block leading-normal">
                              {item.LigneChecklist}
                            </span>
                            {checklistOutputs[item.ControlId] && (
                              <div className="mt-2 p-2 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-md border border-slate-700 max-h-[120px] overflow-y-auto whitespace-pre-wrap text-left shadow-inner">
                                <span className="text-slate-400 block font-bold border-b border-slate-800 pb-1 mb-1 text-[9px] uppercase tracking-wider">
                                  Output / Évidence en clair :
                                </span>
                                {checklistOutputs[item.ControlId]}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.Testable === "Y"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {item.Testable === "Y" ? "Automatisable" : "Manuel [PRA]"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="relative inline-block w-full">
                              <select
                                value={currentState}
                                onChange={(e) => updateChecklistState(item.ControlId, e.target.value as any)}
                                className={`text-xs font-bold py-1.5 px-3 rounded-lg border appearance-none w-full max-w-[200px] text-center pr-8 focus:outline-none ${
                                  currentState === "PASSED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : currentState === "FAILED"
                                    ? "bg-red-50 text-red-700 border-red-300"
                                    : currentState === "VERIFY"
                                    ? "bg-amber-50 text-amber-700 border-amber-300"
                                    : currentState === "NA"
                                    ? "bg-slate-50 text-slate-500 border-slate-300"
                                    : "bg-white text-slate-700 border-slate-200"
                                }`}
                              >
                                <option value="PENDING">⚠️ Non Évalué</option>
                                <option value="PASSED">✅ Conforme (Passed)</option>
                                <option value="FAILED">❌ Non Conforme (Failed)</option>
                                <option value="VERIFY">🔍 A Vérifier</option>
                                <option value="NA">⚪ Non Applicable (N/A)</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none h-3 w-3" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: EXTRACTION LOGS */}
          {activeTab === "logs" && (
            <motion.div
              key="logs_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
              id="extraction_logs_view"
            >
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileClock className="text-slate-700 h-5 w-5" />
                  <span>Journal d'audit et de traçabilité d'extraction</span>
                </h3>
                <p className="text-sm text-slate-500">
                  Cette table de traçabilité (ExtractionLog) liste l'historique des opérations de lecture, d'analyse syntaxique et de transcription du PDF CIS PostgreSQL 15 Benchmark v1.2.0.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="logs_table_panel">
                <table className="w-full text-left border-collapse" id="logs_table">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                      <th className="py-4 px-6 w-[80px]">Étape</th>
                      <th className="py-4 px-4 w-[180px]">Intervalle Pages</th>
                      <th className="py-4 px-4">Message d'opération d'extraction</th>
                      <th className="py-4 px-6">Remarques / OCR appliqués</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {extractionLogs.map((log) => (
                      <tr key={log.Step} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 font-mono">
                          {log.Step}
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium font-mono">
                          {log.PageRange}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {log.Message}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 italic leading-relaxed">
                          {log.Notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-20" id="main_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-slate-400 space-y-2">
          <p className="font-medium text-slate-500">
            CIS PostgreSQL 15 Benchmark Compliance Portal © 2026
          </p>
          <p>
            Les marques CIS, PostgreSQL et le contenu extrait du benchmark appartiennent à leurs propriétaires respectifs. 
            Données et rapports modélisés à des fins de conformité et durcissement de sécurité de l'information.
          </p>
        </div>
      </footer>
    </div>
  );
}
