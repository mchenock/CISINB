#!/usr/bin/env bash
# ==============================================================================
# Script d'Audit de Sécurité CIS PostgreSQL 15 Benchmark v1.2.0
# conçu pour le pilotage et l'audit technique d'une instance PostgreSQL 15.
# ==============================================================================
# Ce script exécute des requêtes de vérification d'audit SQL et système (OS)
# et génère un rapport de conformité exhaustif au format Markdown (audit_report.md).
# ==============================================================================

set -o pipefail

# Couleurs pour l'affichage terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # Pas de couleur

# Variables de connexion par défaut (Surchargées par les variables d'environnement)
DB_USER="${PGUSER:-postgres}"
DB_NAME="${PGDATABASE:-postgres}"
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
PGDATA_DIR="${PGDATA:-/var/lib/postgresql/data}"
REPORT_FILE="cis_audit_report.md"
REPORT_TXT="cis_audit_report.txt"
JSON_FILE="audit_result.json"

# Bannières d'accueil
echo -e "${BLUE}${BOLD}======================================================================${NC}"
echo -e "${BLUE}${BOLD}   CIS PostgreSQL 15 Benchmark v1.2.0 - Script d'Audit Automatisé   ${NC}"
echo -e "${BLUE}${BOLD}======================================================================${NC}"
echo -e "Hôte de connexion : ${DB_HOST}:${DB_PORT}"
echo -e "Base de données   : ${DB_NAME}"
echo -e "Utilisateur       : ${DB_USER}"
echo -e "Dossier PGDATA    : ${PGDATA_DIR}"
echo -e "Fichier rapport MD: ${REPORT_FILE}"
echo -e "Fichier rapport TXT: ${REPORT_TXT}"
echo -e "Fichier JSON      : ${JSON_FILE}"
echo -e "----------------------------------------------------------------------"

# Vérification de l'outil psql
if ! command -v psql &> /dev/null; then
    echo -e "${RED}${BOLD}[ERREUR]${NC} L'utilitaire client 'psql' n'est pas installé sur cette machine."
    echo -e "Veuillez l'installer ou l'ajouter à votre PATH."
    exit 1
fi

# Fonction utilitaire pour exécuter une requête SQL en mode silencieux / sans en-tête
run_sql() {
    local query="$1"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "$query" 2>/dev/null
}

# Vérifier la connexion à la base de données
echo -n "Test de connexion à la base de données... "
CONN_TEST=$(run_sql "SELECT 1;")
if [ "$CONN_TEST" != "1" ]; then
    echo -e "${RED}${BOLD}[ÉCHEC]${NC}"
    echo -e "Impossible de se connecter à l'instance PostgreSQL."
    echo -e "Veuillez vérifier vos accès (mot de passe dans ~/.pgpass ou variable PGPASSWORD)."
    exit 1
fi
echo -e "${GREEN}${BOLD}[OK]${NC}"

# Initialisation des fichiers de rapport
cat << EOF > "$REPORT_FILE"
# Rapport d'Audit de Sécurité CIS PostgreSQL 15
Généré le : $(date -u +"%Y-%m-%dT%H:%M:%SZ") UTC
Hôte cible : $DB_HOST:$DB_PORT
Base d'audit : $DB_NAME
Utilisateur exécutant l'audit : $DB_USER

## 1. Résumé Exécutif de la Conformité

| Statut | Description |
| :--- | :--- |
| **[CONFORME]** | Le paramètre respecte strictement les recommandations du benchmark CIS. |
| **[NON CONFORME]** | Une déviation de sécurité a été détectée et nécessite une remédiation immédiate. |
| **[A VERIFIER]** | Une vérification manuelle ou organisationnelle est requise. |

---

## 2. Détail des Vérifications de Contrôles

EOF

cat << EOF > "$REPORT_TXT"
======================================================================
RAPPORT D'AUDIT SÉCURITÉ EN CLAIR (ÉVIDENCES & TRACABILITÉ)
CIS POSTGRESQL 15 BENCHMARK v1.2.0
Généré le : $(date -u +"%Y-%m-%dT%H:%M:%SZ") UTC
Hôte cible : $DB_HOST:$DB_PORT
Base d'audit : $DB_NAME
Utilisateur exécutant l'audit : $DB_USER
======================================================================

EOF

echo "[" > "$JSON_FILE"

total_checks=0
conforme_count=0
non_conforme_count=0
manual_count=0

# Fonction pour consigner le résultat d'un contrôle dans le rapport et sur le terminal
log_result() {
    local id="$1"
    local titre="$2"
    local status="$3" # OK, FAIL, WARN
    local value="$4"
    local expected="$5"
    local notes="$6"

    # Gérer la virgule pour le format JSON
    local comma=""
    if [ "$total_checks" -gt 0 ]; then
        comma=","
    fi

    total_checks=$((total_checks + 1))

    # Traduction du statut pour l'interface de la checklist
    local react_status="VERIFY"
    if [ "$status" == "OK" ]; then
        react_status="PASSED"
    elif [ "$status" == "FAIL" ]; then
        react_status="FAILED"
    elif [ "$status" == "WARN" ]; then
        react_status="VERIFY"
    fi

    # Nettoyage des guillemets et retours à la ligne pour le JSON
    local clean_value=$(echo "$value" | sed 's/"/\\"/g' | tr -d '\n' | tr -d '\r')
    local clean_notes=$(echo "$notes" | sed 's/"/\\"/g' | tr -d '\n' | tr -d '\r')

    # Écriture dans le fichier JSON
    cat << EOF >> "$JSON_FILE"
$comma{
  "id": "$id",
  "status": "$react_status",
  "value": "$clean_value",
  "notes": "$clean_notes"
}
EOF

    # Écriture dans le rapport texte brut (Preuve / Évidence en clair pour la traçabilité)
    echo "======================================================================" >> "$REPORT_TXT"
    echo "CONTRÔLE $id : $titre" >> "$REPORT_TXT"
    echo "Statut : $react_status" >> "$REPORT_TXT"
    echo "Condition attendue : $expected" >> "$REPORT_TXT"
    echo "Notes/Remédiation : $notes" >> "$REPORT_TXT"
    echo "----------------------------------------------------------------------" >> "$REPORT_TXT"
    echo "VALEUR ACTUELLE / ÉVIDENCE EN CLAIR :" >> "$REPORT_TXT"
    echo "$value" >> "$REPORT_TXT"
    echo "======================================================================" >> "$REPORT_TXT"
    echo "" >> "$REPORT_TXT"

    if [ "$status" == "OK" ]; then
        conforme_count=$((conforme_count + 1))
        echo -e "[ ${GREEN}CONFORME${NC} ] $id - $titre"
        cat << EOF >> "$REPORT_FILE"
### 🟢 [$id] $titre
* **Statut** : **CONFORME**
* **Valeur actuelle** : \`$value\`
* **Condition attendue** : $expected
* **Notes** : $notes

EOF
    elif [ "$status" == "FAIL" ]; then
        non_conforme_count=$((non_conforme_count + 1))
        echo -e "[ ${RED}NON CONFORME${NC} ] $id - $titre"
        cat << EOF >> "$REPORT_FILE"
### 🔴 [$id] $titre
* **Statut** : **NON CONFORME** (Alerte Sécurité)
* **Valeur actuelle** : \`$value\`
* **Condition attendue** : $expected
* **Notes** : $notes

EOF
    else
        manual_count=$((manual_count + 1))
        echo -e "[ ${YELLOW}A VERIFIER${NC} ] $id - $titre"
        cat << EOF >> "$REPORT_FILE"
### 🟡 [$id] $titre
* **Statut** : **A VERIFIER MANUELLEMENT**
* **Valeur actuelle** : \`$value\`
* **Condition attendue** : $expected
* **Notes** : $notes

EOF
    fi
}

# ==============================================================================
# SECTION 1 : Mises à jour et Installation
# ==============================================================================

# 1.1 Version PostgreSQL 15
VERSION_STR=$(run_sql "SELECT version();")
V_NUM=$(run_sql "SHOW server_version_num;")
# server_version_num de PG 15 commence généralement par 15
if [[ "$V_NUM" -ge 150000 ]]; then
    log_result "1.1" "Version de PostgreSQL" "OK" "$VERSION_STR" "Moteur actif >= PostgreSQL 15" "Exécute une version majeure 15 conforme."
else
    log_result "1.1" "Version de PostgreSQL" "FAIL" "$VERSION_STR" "Moteur actif >= PostgreSQL 15" "Version obsolète ou non supportée !"
fi

# 1.2 Extensions actives
EXTENSIONS=$(run_sql "SELECT string_agg(extname, ', ') FROM pg_extension;")
log_result "1.2" "Extensions installées" "WARN" "$EXTENSIONS" "Seules les extensions approuvées" "Vérifier la légitimité de ces extensions par rapport à votre politique de sécurité interne."

# 1.3 Langages de procédures de confiance
UNTRUSTED_LANGS=$(run_sql "SELECT string_agg(lanname, ', ') FROM pg_language WHERE lanpltrusted = false;")
if [ -z "$UNTRUSTED_LANGS" ]; then
    log_result "1.3" "Langages de procédure non approuvés" "OK" "Aucun" "Aucun langage de confiance=false" "Aucun langage non approuvé disponible pour le public."
else
    log_result "1.3" "Langages de procédure non approuvés" "FAIL" "$UNTRUSTED_LANGS" "Aucun langage non approuvé en accès public" "Des langages non autorisés (ex: plpythonu, plperlu) sont actifs et représentent un risque."
fi


# ==============================================================================
# SECTION 2 : Fichiers et Répertoires (Permissions physiques)
# ==============================================================================

# 2.1 Permissions sur le dossier PGDATA (Uniquement disponible si exécuté localement)
if [ -d "$PGDATA_DIR" ]; then
    PGDATA_PERMS=$(stat -c "%a" "$PGDATA_DIR" 2>/dev/null)
    PGDATA_OWNER=$(stat -c "%U" "$PGDATA_DIR" 2>/dev/null)
    if [ "$PGDATA_PERMS" == "700" ] || [ "$PGDATA_PERMS" == "750" ]; then
        log_result "2.1" "Permissions sur PGDATA" "OK" "Permissions: $PGDATA_PERMS (Propriétaire: $PGDATA_OWNER)" "0700 ou 0750" "Le répertoire de données physiques est correctement cloisonné."
    else
        log_result "2.1" "Permissions sur PGDATA" "FAIL" "Permissions: $PGDATA_PERMS" "0700 ou 0750" "Permissions trop permissives ! Risque de vol physique de tables."
    fi
else
    log_result "2.1" "Permissions sur PGDATA" "WARN" "Dossier PGDATA non accessible localement ($PGDATA_DIR)" "0700 ou 0750" "Vérification locale impossible. À auditer directement sur le serveur physique de base de données."
fi


# ==============================================================================
# SECTION 3 : Journalisation et Audit (Logging)
# ==============================================================================

# 3.1 logging_collector
LOG_COLL=$(run_sql "SHOW logging_collector;")
if [ "$LOG_COLL" == "on" ]; then
    log_result "3.1" "logging_collector" "OK" "on" "on" "Le collecteur de logs est bien actif."
else
    log_result "3.1" "logging_collector" "FAIL" "$LOG_COLL" "on" "Le collecteur est éteint. Des événements d'audit vitaux risquent d'être perdus !"
fi

# 3.2 log_destination
LOG_DEST=$(run_sql "SHOW log_destination;")
log_result "3.2" "log_destination" "WARN" "$LOG_DEST" "stderr, csvlog, syslog ou jsonlog" "Valider la conformité de la destination des logs par rapport au collecteur central (SIEM)."

# 3.3 log_file_mode
LOG_MODE=$(run_sql "SHOW log_file_mode;")
if [ "$LOG_MODE" == "0600" ] || [ "$LOG_MODE" == "600" ]; then
    log_result "3.3" "log_file_mode" "OK" "$LOG_MODE" "0600" "Les permissions sur les fichiers de log créés sont conformes."
else
    log_result "3.3" "log_file_mode" "FAIL" "$LOG_MODE" "0600" "Les fichiers de log sont trop permissifs (fuite potentielle d'informations)."
fi

# 3.4 log_min_messages
LOG_MIN_MSG=$(run_sql "SHOW log_min_messages;")
if [[ "$LOG_MIN_MSG" =~ ^(warning|error|log|fatal|panic)$ ]]; then
    log_result "3.4" "log_min_messages" "OK" "$LOG_MIN_MSG" "warning ou plus restrictif" "Le niveau d'erreur minimum est correctement configuré."
else
    log_result "3.4" "log_min_messages" "FAIL" "$LOG_MIN_MSG" "warning" "Trop verbeux ou pas assez restrictif."
fi

# 3.5 log_min_error_statement
LOG_MIN_ERROR_STATE=$(run_sql "SHOW log_min_error_statement;")
if [[ "$LOG_MIN_ERROR_STATE" =~ ^(error|log|fatal|panic)$ ]]; then
    log_result "3.5" "log_min_error_statement" "OK" "$LOG_MIN_ERROR_STATE" "error ou plus restrictif" "Les requêtes provoquant des erreurs sont tracées."
else
    log_result "3.5" "log_min_error_statement" "FAIL" "$LOG_MIN_ERROR_STATE" "error" "Risque de non-journalisation des erreurs SQL (tentatives d'injections furtives)."
fi

# 3.7 log_line_prefix
LOG_PREFIX=$(run_sql "SHOW log_line_prefix;")
if [[ "$LOG_PREFIX" == *"%m"* ]] && [[ "$LOG_PREFIX" == *"%p"* ]] && [[ "$LOG_PREFIX" == *"%u"* ]] && [[ "$LOG_PREFIX" == *"%d"* ]]; then
    log_result "3.7" "log_line_prefix" "OK" "$LOG_PREFIX" "Doit contenir au moins %m, %p, %u, %d" "Traçabilité fine : Temps (%m), PID (%p), User (%u) et DB (%d) inclus."
else
    log_result "3.7" "log_line_prefix" "FAIL" "$LOG_PREFIX" "Doit contenir au moins %m, %p, %u, %d" "Insuffisant pour la corrélation d'événements de sécurité !"
fi

# 3.8 log_connections
LOG_CONN=$(run_sql "SHOW log_connections;")
if [ "$LOG_CONN" == "on" ]; then
    log_result "3.8" "log_connections" "OK" "on" "on" "La trace des connexions réussies est active."
else
    log_result "3.8" "log_connections" "FAIL" "$LOG_CONN" "on" "Les accès d'utilisateurs ne sont pas enregistrés !"
fi

# 3.9 log_disconnections
LOG_DISCONN=$(run_sql "SHOW log_disconnections;")
if [ "$LOG_DISCONN" == "on" ]; then
    log_result "3.9" "log_disconnections" "OK" "on" "on" "La déconnexion des sessions est bien journalisée."
else
    log_result "3.9" "log_disconnections" "FAIL" "$LOG_DISCONN" "on" "Impossible d'auditer la durée de connexion des comptes !"
fi

# 3.12 log_lock_waits
LOG_LOCKS=$(run_sql "SHOW log_lock_waits;")
if [ "$LOG_LOCKS" == "on" ]; then
    log_result "3.12" "log_lock_waits" "OK" "on" "on" "Les attentes de verrous longs sont correctement capturées."
else
    log_result "3.12" "log_lock_waits" "FAIL" "$LOG_LOCKS" "on" "Risque de masquer les tentatives de dénis de service par blocage applicatif."
fi

# 3.13 log_statement
LOG_STMT=$(run_sql "SHOW log_statement;")
if [[ "$LOG_STMT" =~ ^(ddl|mod|all)$ ]]; then
    log_result "3.13" "log_statement" "OK" "$LOG_STMT" "ddl, mod ou all" "Les modifications structurelles (DDL/DML) sont tracées."
else
    log_result "3.13" "log_statement" "FAIL" "$LOG_STMT" "ddl ou mod" "Aucune traçabilité sur les créations ou suppressions d'objets !"
fi


# ==============================================================================
# SECTION 4 : Contrôle des Accès et Identités
# ==============================================================================

# 4.1 Méthodes de connexion 'trust' actives
TRUST_RULES=$(run_sql "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method = 'trust';")
if [ "$TRUST_RULES" -eq 0 ]; then
    log_result "4.1" "Vérification des connexions 'trust'" "OK" "0 règle trust détectée" "0 règle trust" "Excellente pratique : aucun accès sans mot de passe n'est configuré."
else
    log_result "4.1" "Vérification des connexions 'trust'" "FAIL" "$TRUST_RULES règle(s) trust configurée(s)" "0 règle trust" "DANGER : des connexions sans mot de passe sont actives dans pg_hba.conf !"
fi

# 4.2 Superutilisateurs (SUPERUSER)
SUPERUSERS=$(run_sql "SELECT string_agg(rolname, ', ') FROM pg_roles WHERE rolsuper = true;")
# S'il n'y a que 'postgres' (ou 1 seul compte d'admin officiel), c'est bon
SU_COUNT=$(run_sql "SELECT count(*) FROM pg_roles WHERE rolsuper = true;")
if [ "$SU_COUNT" -le 2 ]; then
    log_result "4.2" "Comptes SUPERUSER" "OK" "$SUPERUSERS" "Uniquement les comptes d'administration légitimes" "Droits superuser limités au strict nécessaire."
else
    log_result "4.2" "Comptes SUPERUSER" "FAIL" "Trop de comptes superuser ($SUPERUSERS)" "Privilèges minimaux" "Risque élevé d'élévation de privilèges."
fi

# 4.6 Privilèges sur pg_authid
AUTHID_PRIV=$(run_sql "SELECT has_table_privilege('public', 'pg_authid', 'SELECT');")
if [ "$AUTHID_PRIV" == "f" ]; then
    log_result "4.6" "Cloisonnement de pg_authid" "OK" "Non lisible par le PUBLIC" "false" "Les hashs de mot de passe sont parfaitement invisibles."
else
    log_result "4.6" "Cloisonnement de pg_authid" "FAIL" "Lisible par PUBLIC !" "false" "Risque d'aspiration et cassage hors-ligne des mots de passe !"
fi

# 4.8 password_encryption
PASS_ENCRYPT=$(run_sql "SHOW password_encryption;")
if [ "$PASS_ENCRYPT" == "scram-sha-256" ]; then
    log_result "4.8" "password_encryption (SCRAM)" "OK" "scram-sha-256" "scram-sha-256" "Le chiffrement par défaut des mots de passe est fort."
else
    log_result "4.8" "password_encryption (SCRAM)" "FAIL" "$PASS_ENCRYPT" "scram-sha-256" "Chiffrement MD5 obsolète ou mot de passe en clair détecté !"
fi


# ==============================================================================
# SECTION 5 : Paramètres Réseau et Chiffrement (SSL)
# ==============================================================================

# 5.1 ssl
SSL_ACTIVE=$(run_sql "SHOW ssl;")
if [ "$SSL_ACTIVE" == "on" ]; then
    log_result "5.1" "ssl (Chiffrement réseau)" "OK" "on" "on" "Le chiffrement SSL de l'ensemble du trafic réseau est actif."
else
    log_result "5.1" "ssl (Chiffrement réseau)" "FAIL" "$SSL_ACTIVE" "on" "Les mots de passe et données circulent en clair sur le réseau !"
fi

# 5.2 ssl_min_protocol_version
SSL_MIN_V=$(run_sql "SHOW ssl_min_protocol_version;")
if [[ "$SSL_MIN_V" =~ ^(TLSv1.2|TLSv1.3)$ ]]; then
    log_result "5.2" "ssl_min_protocol_version" "OK" "$SSL_MIN_V" "TLSv1.2 ou TLSv1.3" "Protocoles obsolètes (TLSv1.0 et TLSv1.1) interdits."
else
    log_result "5.2" "ssl_min_protocol_version" "FAIL" "$SSL_MIN_V" "TLSv1.2" "Vulnérabilités de rétrogradation TLS actives !"
fi


# ==============================================================================
# SECTION 8 : Maintenance et autovacuum
# ==============================================================================

# 8.1 autovacuum
AUTOVACUUM=$(run_sql "SHOW autovacuum;")
if [ "$AUTOVACUUM" == "on" ]; then
    log_result "8.1" "autovacuum" "OK" "on" "on" "Le démon de nettoyage et de prévention de wraparound est bien actif."
else
    log_result "8.1" "autovacuum" "FAIL" "$AUTOVACUUM" "on" "Risque majeur de corruption et de blocage d'écriture de la base !"
fi


# ==============================================================================
# SYNTHÈSE GLOBALE ET FIN DE RAPPORT
# ==============================================================================

# Calcul du taux de conformité
compliance_rate=0
if [ "$total_checks" -gt 0 ]; then
    compliance_rate=$(( (conforme_count * 100) / total_checks ))
fi

# Écriture du résumé en tête de rapport (Insertion élégante en haut du fichier)
temp_summary="## Résumé Statistique de Conformité

* **Taux de conformité** : **${compliance_rate}%**
* **Contrôles Conformes** : **${conforme_count}** / ${total_checks}
* **Contrôles Non Conformes** : **${non_conforme_count}**
* **Contrôles en attente d'évaluation / Revue documentaire** : **${manual_count}**

---
"

# Fusionner le résumé technique
sed -i "s/## 1. Résumé Exécutif de la Conformité/## 1. Résumé Exécutif de la Conformité\n\n$temp_summary/g" "$REPORT_FILE"

# Écriture de la synthèse finale dans le fichier TXT en clair
cat << EOF >> "$REPORT_TXT"
======================================================================
SYNTHÈSE GLOBALE DE CONFORMITÉ
----------------------------------------------------------------------
Taux de conformité : ${compliance_rate}%
Contrôles Conformes : ${conforme_count} / ${total_checks}
Contrôles Non Conformes : ${non_conforme_count}
Contrôles A Vérifier (Revue documentaire) : ${manual_count}
======================================================================
EOF

# Clore le tableau JSON
echo "]" >> "$JSON_FILE"

echo "----------------------------------------------------------------------"
echo -e "${BOLD}Rapport d'audit technique généré avec succès !${NC}"
echo -e "Rapport détaillé Markdown : ${REPORT_FILE}"
echo -e "Preuves d'audit en clair  : ${REPORT_TXT}"
echo -e "Données JSON d'import     : ${JSON_FILE}"
echo -e "Score de conformité       : ${BOLD}${compliance_rate}%${NC}"
echo "----------------------------------------------------------------------"
