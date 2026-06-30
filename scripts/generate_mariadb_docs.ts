import * as fs from 'fs';
import { mariadbControlsData } from '../src/data/mariadbData.js';

let bashScript = `#!/usr/bin/env bash
# ==============================================================================
# Script d'Audit de Sécurité CIS MariaDB 10.6 Benchmark v1.0.0
# conçu pour le pilotage et l'audit technique d'une instance MariaDB 10.6.
# ==============================================================================
# Ce script exécute des requêtes de vérification d'audit SQL et système (OS)
# et génère un rapport de conformité exhaustif au format texte (mariadb_audit_report.txt).
# ==============================================================================

set -o pipefail

# Couleurs pour l'affichage terminal
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[0;33m'
BLUE='\\033[0;34m'
BOLD='\\033[1m'
NC='\\033[0m' # Pas de couleur

# Variables de connexion par défaut (Surchargées par les variables d'environnement)
DB_USER="\${MARIADB_USER:-root}"
DB_NAME="\${MARIADB_DATABASE:-mysql}"
DB_HOST="\${MARIADB_HOST:-localhost}"
DB_PORT="\${MARIADB_PORT:-3306}"
DB_PASS="\${MARIADB_PASSWORD:-}"

REPORT_TXT="mariadb_audit_report.txt"
JSON_FILE="audit_result.json"

# Bannières d'accueil
echo -e "\${BLUE}\${BOLD}======================================================================\${NC}"
echo -e "\${BLUE}\${BOLD}     CIS MariaDB 10.6 - Script d'Audit Technique Automatisé          \${NC}"
echo -e "\${BLUE}\${BOLD}======================================================================\${NC}"
echo -e "Hôte de connexion : \${DB_HOST}:\${DB_PORT}"
echo -e "Base de données   : \${DB_NAME}"
echo -e "Utilisateur       : \${DB_USER}"
echo -e "Fichier rapport   : \${REPORT_TXT}"
echo -e "Fichier JSON      : \${JSON_FILE}"
echo -e "----------------------------------------------------------------------"

# Vérification du client mysql
if ! command -v mysql &> /dev/null; then
    echo -e "\${RED}\${BOLD}[ERREUR]\${NC} L'utilitaire client 'mysql' n'est pas installé sur cette machine."
    echo -e "Veuillez l'installer ou l'ajouter à votre PATH."
    exit 1
fi

if [ -n "\$DB_PASS" ]; then
    export MYSQL_PWD="\$DB_PASS"
fi

# Fonction utilitaire pour exécuter une requête SQL
run_mysql() {
    local query="\$1"
    mysql -h "\$DB_HOST" -P "\$DB_PORT" -u "\$DB_USER" "\$DB_NAME" -t -e "\$query" 2>&1
}

run_shell() {
    local cmd="\$1"
    eval "\$cmd" 2>&1
}

# Test de connexion
echo -n "Test de connexion à la base de données... "
CONN_TEST=\$(run_mysql "SELECT 1;")
if [[ "\$CONN_TEST" == *"Access denied"* || "\$CONN_TEST" == *"Can't connect"* ]]; then
    echo -e "\${RED}\${BOLD}[ÉCHEC]\${NC}"
    echo -e "Impossible de se connecter à l'instance MariaDB."
    echo -e "Veuillez vérifier vos accès (MARIADB_USER, MARIADB_PASSWORD, etc.)."
    exit 1
fi
echo -e "\${GREEN}\${BOLD}[OK]\${NC}"

# Initialisation du fichier de rapport TXT
cat << EOF > "\$REPORT_TXT"
======================================================================
RAPPORT D'AUDIT TECHNIQUE SÉCURITÉ - CIS MARIADB 10.6 BENCHMARK
Généré le : \$(date -u +"%Y-%m-%dT%H:%M:%SZ") UTC
Hôte d'audit : \$DB_HOST:\$DB_PORT
Base d'audit : \$DB_NAME
Utilisateur SQL : \$DB_USER
======================================================================

EOF

echo "[" > "\$JSON_FILE"
total_checks=0
conforme_count=0
non_conforme_count=0
manual_count=0

run_control() {
    local id="\$1"
    local titre="\$2"
    local desc="\$3"
    local procedure="\$4"
    local expected="\$5"
    local cmd="\$6"
    local is_sql="\$7"

    echo "======================================================================" >> "\$REPORT_TXT"
    echo "CONTRÔLE \$id : \$titre" >> "\$REPORT_TXT"
    echo "Description : \$desc" >> "\$REPORT_TXT"
    echo "Procédure d'audit : \$procedure" >> "\$REPORT_TXT"
    echo "Résultat attendu : \$expected" >> "\$REPORT_TXT"
    echo "----------------------------------------------------------------------" >> "\$REPORT_TXT"

    local output=""
    local status="VERIFY"

    if [ -z "\$cmd" ]; then
        echo "Aucune commande automatisée disponible (audit manuel requis)." >> "\$REPORT_TXT"
        output="[REVUE MANUELLE REQUISE]"
        status="VERIFY"
        manual_count=\$((manual_count + 1))
        echo -e "[ \${YELLOW}A VERIFIER\${NC} ] \$id - \$titre"
    else
        echo "[!] Commande exécutée :" >> "\$REPORT_TXT"
        echo "    \$cmd" >> "\$REPORT_TXT"
        echo "" >> "\$REPORT_TXT"
        echo "[>] Output obtenu :" >> "\$REPORT_TXT"

        if [ "\$is_sql" -eq 1 ]; then
            output=\$(run_mysql "\$cmd")
        else
            output=\$(run_shell "\$cmd")
        fi

        echo "\$output" >> "\$REPORT_TXT"
        echo "" >> "\$REPORT_TXT"

        status="VERIFY"
        
        if [ -z "\$output" ]; then
            status="FAILED"
            non_conforme_count=\$((non_conforme_count + 1))
            echo -e "[ \${RED}NON CONFORME\${NC} ] \$id - \$titre"
        elif [[ "\$output" == *"Access denied"* || "\$output" == *"Command not found"* || "\$output" == *"command not found"* ]]; then
            status="VERIFY"
            manual_count=\$((manual_count + 1))
            echo -e "[ \${YELLOW}A VERIFIER\${NC} ] \$id - \$titre (Erreur accès/exécution)"
        else
            # Heuristiques spécifiques
            if [ "\$id" == "2.6" ]; then
                if [[ "\$output" =~ [0-9]+ ]]; then
                    val=\$(echo "\$output" | grep -o '[0-9]\\+' | head -n1)
                    if [ "\$val" -le 365 ]; then status="PASSED"; else status="FAILED"; fi
                fi
            elif [ "\$id" == "2.9" ]; then
                if [[ "\$output" == *"bind_address"* && ! "\$output" == *"0.0.0.0"* ]]; then
                    status="PASSED"
                elif [[ "\$output" == *"0.0.0.0"* ]]; then
                    status="FAILED"
                fi
            elif [ "\$id" == "4.5" ]; then
                if [[ "\$output" == *"skip-grant-tables"* ]]; then status="FAILED"; else status="PASSED"; fi
            elif [ "\$id" == "7.5" ]; then
                if [[ "\$output" == *"%"* ]]; then status="FAILED"; else status="PASSED"; fi
            elif [ "\$id" == "7.6" ]; then
                if [[ -z "\$output" || "\$output" == *"0 rows"* ]]; then status="PASSED"; else status="FAILED"; fi
            fi

            if [ "\$status" == "PASSED" ]; then
                conforme_count=\$((conforme_count + 1))
                echo -e "[ \${GREEN}CONFORME\${NC} ] \$id - \$titre"
            elif [ "\$status" == "FAILED" ]; then
                non_conforme_count=\$((non_conforme_count + 1))
                echo -e "[ \${RED}NON CONFORME\${NC} ] \$id - \$titre"
            else
                manual_count=\$((manual_count + 1))
                echo -e "[ \${YELLOW}A VERIFIER\${NC} ] \$id - \$titre"
            fi
        fi
    fi

    echo "Statut d'audit : \$status" >> "\$REPORT_TXT"
    echo "======================================================================" >> "\$REPORT_TXT"
    echo "" >> "\$REPORT_TXT"

    local comma=""
    if [ "\$total_checks" -gt 0 ]; then
        comma=","
    fi
    total_checks=\$((total_checks + 1))

    # Clean string for JSON
    local clean_output=\$(echo "\$output" | sed 's/"/\\\\"/g' | tr '\\n' ' ' | tr '\\r' ' ' | head -c 250)
    cat << EOF >> "\$JSON_FILE"
\$comma{
  "id": "\$id",
  "status": "\$status",
  "value": "\$clean_output"
}
EOF
}

echo "Exécution des contrôles d'audit..."
`;

let mdDoc = `# CIS MariaDB 10.6 Audit Procedure

This document describes the audit procedures for MariaDB 10.6 CIS Benchmark.

`;

mariadbControlsData.forEach(c => {
  const isShell = c.Commandes.startsWith('ps ') || c.Commandes.startsWith('grep') || c.Commandes.startsWith('ls') || c.Commandes.startsWith('find') || c.Commandes.startsWith('getent') || c.Commandes.startsWith('crontab') || c.Commandes.startsWith('cat') || c.Commandes.startsWith('chmod') || c.Commandes.startsWith('chown') || c.Commandes.startsWith('mariabackup') || c.Commandes.startsWith('my_print_defaults');
  const is_sql = isShell ? 0 : 1;
  const escapedDesc = c.Description.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const escapedProc = c.Procédure.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const escapedExpected = c.ResultatAttendu.replace(/"/g, '\\"').replace(/\n/g, ' ');
  const escapedCmd = c.Commandes ? c.Commandes.replace(/"/g, '\\"') : "";

  bashScript += `\nrun_control "${c.ControlId}" "${c.Titre}" "${escapedDesc}" "${escapedProc}" "${escapedExpected}" "${escapedCmd}" ${is_sql}\n`;

  mdDoc += `## ${c.ControlId} ${c.Titre}\n`;
  mdDoc += `**Description**: ${c.Description}\n\n`;
  mdDoc += `**Procédure**: ${c.Procédure}\n\n`;
  mdDoc += `**Résultat Attendu**: ${c.ResultatAttendu}\n\n`;
  mdDoc += `**Remédiation**: ${c.Remediation}\n\n`;
  mdDoc += `---\n\n`;
});

bashScript += `
echo "]" >> "\$JSON_FILE"

# Rapport final en console
compliance_rate=0
if [ "\$total_checks" -gt 0 ]; then
    compliance_rate=\$(( (conforme_count * 100) / total_checks ))
fi

echo "----------------------------------------------------------------------"
echo -e "\${BOLD}Rapport d'audit technique MariaDB généré avec succès !\${NC}"
echo -e "Fichier TXT brut : \${REPORT_TXT}"
echo -e "Fichier JSON d'import : \${JSON_FILE}"
echo -e "Taux de conformité : \${BOLD}\${compliance_rate}%\${NC}"
echo "----------------------------------------------------------------------"
`;

fs.writeFileSync('public/audit_mariadb106.sh', bashScript);
fs.writeFileSync('public/AUDIT_PROCEDURE_MARIADB.md', mdDoc);
console.log("Docs generated!");

