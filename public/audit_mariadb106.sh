#!/usr/bin/env bash
# ==============================================================================
# Script d'Audit de Sécurité CIS MariaDB 10.6 Benchmark v1.0.0
# conçu pour le pilotage et l'audit technique d'une instance MariaDB 10.6.
# ==============================================================================
# Ce script exécute des requêtes de vérification d'audit SQL et système (OS)
# et génère un rapport de conformité exhaustif au format texte (mariadb_audit_report.txt).
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
DB_USER="${MARIADB_USER:-root}"
DB_NAME="${MARIADB_DATABASE:-mysql}"
DB_HOST="${MARIADB_HOST:-localhost}"
DB_PORT="${MARIADB_PORT:-3306}"
DB_PASS="${MARIADB_PASSWORD:-}"

REPORT_TXT="mariadb_audit_report.txt"
JSON_FILE="audit_result.json"

# Bannières d'accueil
echo -e "${BLUE}${BOLD}======================================================================${NC}"
echo -e "${BLUE}${BOLD}     CIS MariaDB 10.6 - Script d'Audit Technique Automatisé          ${NC}"
echo -e "${BLUE}${BOLD}======================================================================${NC}"
echo -e "Hôte de connexion : ${DB_HOST}:${DB_PORT}"
echo -e "Base de données   : ${DB_NAME}"
echo -e "Utilisateur       : ${DB_USER}"
echo -e "Fichier rapport   : ${REPORT_TXT}"
echo -e "Fichier JSON      : ${JSON_FILE}"
echo -e "----------------------------------------------------------------------"

# Vérification du client mysql
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}${BOLD}[ERREUR]${NC} L'utilitaire client 'mysql' n'est pas installé sur cette machine."
    echo -e "Veuillez l'installer ou l'ajouter à votre PATH."
    exit 1
fi

if [ -n "$DB_PASS" ]; then
    export MYSQL_PWD="$DB_PASS"
fi

# Fonction utilitaire pour exécuter une requête SQL
run_mysql() {
    local query="$1"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -t -e "$query" 2>&1
}

run_shell() {
    local cmd="$1"
    eval "$cmd" 2>&1
}

# Test de connexion
echo -n "Test de connexion à la base de données... "
CONN_TEST=$(run_mysql "SELECT 1;")
if [[ "$CONN_TEST" == *"Access denied"* || "$CONN_TEST" == *"Can't connect"* ]]; then
    echo -e "${RED}${BOLD}[ÉCHEC]${NC}"
    echo -e "Impossible de se connecter à l'instance MariaDB."
    echo -e "Veuillez vérifier vos accès (MARIADB_USER, MARIADB_PASSWORD, etc.)."
    exit 1
fi
echo -e "${GREEN}${BOLD}[OK]${NC}"

# Initialisation du fichier de rapport TXT
cat << EOF > "$REPORT_TXT"
======================================================================
RAPPORT D'AUDIT TECHNIQUE SÉCURITÉ - CIS MARIADB 10.6 BENCHMARK
Généré le : $(date -u +"%Y-%m-%dT%H:%M:%SZ") UTC
Hôte d'audit : $DB_HOST:$DB_PORT
Base d'audit : $DB_NAME
Utilisateur SQL : $DB_USER
======================================================================

EOF

echo "[" > "$JSON_FILE"
total_checks=0
conforme_count=0
non_conforme_count=0
manual_count=0

run_control() {
    local id="$1"
    local titre="$2"
    local desc="$3"
    local procedure="$4"
    local expected="$5"
    local cmd="$6"
    local is_sql="$7"

    echo "======================================================================" >> "$REPORT_TXT"
    echo "CONTRÔLE $id : $titre" >> "$REPORT_TXT"
    echo "Description : $desc" >> "$REPORT_TXT"
    echo "Procédure d'audit : $procedure" >> "$REPORT_TXT"
    echo "Résultat attendu : $expected" >> "$REPORT_TXT"
    echo "----------------------------------------------------------------------" >> "$REPORT_TXT"

    local output=""
    local status="VERIFY"

    if [ -z "$cmd" ]; then
        echo "Aucune commande automatisée disponible (audit manuel requis)." >> "$REPORT_TXT"
        output="[REVUE MANUELLE REQUISE]"
        status="VERIFY"
        manual_count=$((manual_count + 1))
        echo -e "[ ${YELLOW}A VERIFIER${NC} ] $id - $titre"
    else
        echo "[!] Commande exécutée :" >> "$REPORT_TXT"
        echo "    $cmd" >> "$REPORT_TXT"
        echo "" >> "$REPORT_TXT"
        echo "[>] Output obtenu :" >> "$REPORT_TXT"

        if [ "$is_sql" -eq 1 ]; then
            output=$(run_mysql "$cmd")
        else
            output=$(run_shell "$cmd")
        fi

        echo "$output" >> "$REPORT_TXT"
        echo "" >> "$REPORT_TXT"

        status="VERIFY"
        
        if [ -z "$output" ]; then
            status="FAILED"
            non_conforme_count=$((non_conforme_count + 1))
            echo -e "[ ${RED}NON CONFORME${NC} ] $id - $titre"
        elif [[ "$output" == *"Access denied"* || "$output" == *"Command not found"* || "$output" == *"command not found"* ]]; then
            status="VERIFY"
            manual_count=$((manual_count + 1))
            echo -e "[ ${YELLOW}A VERIFIER${NC} ] $id - $titre (Erreur accès/exécution)"
        else
            # Heuristiques spécifiques
            if [ "$id" == "2.6" ]; then
                if [[ "$output" =~ [0-9]+ ]]; then
                    val=$(echo "$output" | grep -o '[0-9]\+' | head -n1)
                    if [ "$val" -le 365 ]; then status="PASSED"; else status="FAILED"; fi
                fi
            elif [ "$id" == "2.9" ]; then
                if [[ "$output" == *"bind_address"* && ! "$output" == *"0.0.0.0"* ]]; then
                    status="PASSED"
                elif [[ "$output" == *"0.0.0.0"* ]]; then
                    status="FAILED"
                fi
            elif [ "$id" == "4.5" ]; then
                if [[ "$output" == *"skip-grant-tables"* ]]; then status="FAILED"; else status="PASSED"; fi
            elif [ "$id" == "7.5" ]; then
                if [[ "$output" == *"%"* ]]; then status="FAILED"; else status="PASSED"; fi
            elif [ "$id" == "7.6" ]; then
                if [[ -z "$output" || "$output" == *"0 rows"* ]]; then status="PASSED"; else status="FAILED"; fi
            fi

            if [ "$status" == "PASSED" ]; then
                conforme_count=$((conforme_count + 1))
                echo -e "[ ${GREEN}CONFORME${NC} ] $id - $titre"
            elif [ "$status" == "FAILED" ]; then
                non_conforme_count=$((non_conforme_count + 1))
                echo -e "[ ${RED}NON CONFORME${NC} ] $id - $titre"
            else
                manual_count=$((manual_count + 1))
                echo -e "[ ${YELLOW}A VERIFIER${NC} ] $id - $titre"
            fi
        fi
    fi

    echo "Statut d'audit : $status" >> "$REPORT_TXT"
    echo "======================================================================" >> "$REPORT_TXT"
    echo "" >> "$REPORT_TXT"

    local comma=""
    if [ "$total_checks" -gt 0 ]; then
        comma=","
    fi
    total_checks=$((total_checks + 1))

    # Clean string for JSON
    local clean_output=$(echo "$output" | sed 's/"/\\"/g' | tr '\n' ' ' | tr '\r' ' ' | head -c 250)
    cat << EOF >> "$JSON_FILE"
$comma{
  "id": "$id",
  "status": "$status",
  "value": "$clean_output"
}
EOF
}

echo "Exécution des contrôles d'audit..."

run_control "1.1" "Placer les bases de données sur des partitions non système" "Les systèmes d'exploitation hôtes doivent inclure différentes partitions. La base de données doit être placée sur une partition non système." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME LIKE '%dir' or VARIABLE_NAME LIKE '%file'; Puis vérifier avec df -h" "Le répertoire ne doit pas être sur root (/), /var ou /usr." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME LIKE '%dir';" 1

run_control "1.2" "Utiliser un compte dédié avec le moins de privilèges pour le service MariaDB" "Fournir un utilisateur dédié (mysql) sans droits d'administration." "ps -ef | egrep \"^mysql.*$\"" "Le processus doit s'exécuter sous l'utilisateur mysql." "ps -ef | egrep \"^mysql.*$\"" 0

run_control "1.3" "Désactiver l'historique des commandes MariaDB" "Le client mysql écrit un historique dans .mysql_history. Ce fichier peut contenir des mots de passe." "find /home -name \".mysql_history\"; find /root -name \".mysql_history\"" "Le fichier doit être lié à /dev/null." "find /home -name \".mysql_history\"" 0

run_control "1.4" "Vérifier que la variable d'environnement MYSQL_PWD n'est pas utilisée" "MariaDB peut lire un mot de passe depuis MYSQL_PWD. Cela implique un mot de passe en clair." "grep MYSQL_PWD /proc/*/environ" "Aucun résultat ne doit être retourné." "grep MYSQL_PWD /proc/*/environ" 0

run_control "1.5" "S'assurer que la connexion interactive est désactivée" "L'utilisateur MariaDB ne doit pas avoir un accès interactif au système d'exploitation." "getent passwd mysql | egrep \"^.*[\/bin\/false|\/sbin\/nologin]$\"" "Le shell doit être /bin/false ou /sbin/nologin." "getent passwd mysql" 0

run_control "1.6" "Vérifier que MYSQL_PWD n'est pas défini dans les profils utilisateurs" "MYSQL_PWD ne doit pas être présent dans .bashrc ou .profile." "grep MYSQL_PWD /home/*/.{bashrc,profile,bash_profile}" "Aucun résultat attendu." "grep MYSQL_PWD /home/*/.profile" 0

run_control "1.7" "S'assurer que MariaDB s'exécute dans un environnement Sandbox" "L'utilisation de chroot(), systemd isolation, ou docker met MariaDB dans un bac à sable." "cat /etc/mysql | egrep '(?<=^chroot=).+$'" "Un chemin chroot valide doit être configuré." "cat /etc/mysql | egrep '(?<=^chroot=).+$'" 0

run_control "2.1.1" "Politique de sauvegarde en place" "Une politique de sauvegarde doit être documentée et planifiée." "crontab -l" "Une planification de sauvegarde doit être listée." "crontab -l" 0

run_control "2.1.2" "Vérifier que les sauvegardes sont valides" "Les sauvegardes doivent être validées régulièrement." "Vérifier les rapports de test de validation des sauvegardes." "Rapports de validation réussie." "" 1

run_control "2.1.3" "Sécuriser les identifiants de sauvegarde" "L'utilisateur de la base de données effectuant les sauvegardes doit utiliser des identifiants protégés." "Vérifier les permissions des fichiers contenant les mots de passe et clés SSL." "Permissions restrictives (ex: 600 ou 400)." "" 1

run_control "2.1.4" "Les sauvegardes doivent être correctement sécurisées" "Les sauvegardes contiennent toutes les données. Elles doivent être protégées par des permissions strictes et du chiffrement." "Vérifier les permissions des fichiers de sauvegarde, le groupe, et si elles sont chiffrées." "Les sauvegardes ne sont pas lisibles par tout le monde et sont chiffrées." "mariabackup --backup --stream=xbstream | openssl enc -aes-256-cbc" 0

run_control "2.1.5" "Récupération à un instant précis (Point-in-Time Recovery)" "Les binlogs permettent de restaurer à un instant précis." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name = 'binlog_expire_logs_seconds';" "La valeur ne doit pas être 0." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name = 'binlog_expire_logs_seconds';" 1

run_control "2.1.6" "Plan de reprise d'activité (DR)" "Une stratégie de reprise d'activité doit être planifiée." "Vérifier l'existence d'un plan de reprise d'activité." "Un plan DR existe et est testé." "" 1

run_control "2.1.7" "Sauvegarde de la configuration et des fichiers liés" "Les fichiers de configuration, certificats et UDFs doivent être sauvegardés." "Vérifier que les fichiers my.cnf, certificats SSL, clés, logs d'audit sont sauvegardés." "Les fichiers sont inclus dans la sauvegarde." "" 1

run_control "2.2" "Dédier la machine exécutant MariaDB" "MariaDB doit être installé sur un serveur dédié." "Vérifier qu'aucun autre service n'est installé." "Seul MariaDB s'exécute." "" 1

run_control "2.3" "Ne pas spécifier de mots de passe en ligne de commande" "Les mots de passe passés via -p peuvent être visibles dans l'historique." "Vérifier l'historique shell pour des commandes avec -p." "Aucune commande MariaDB avec le mot de passe en clair." "" 1

run_control "2.4" "Ne pas réutiliser les noms d'utilisateur" "Les comptes de base de données ne doivent pas être réutilisés pour plusieurs applications ou utilisateurs." "SELECT host, user, plugin FROM mysql.user;" "Chaque compte a un usage unique et spécifique." "SELECT host, user, plugin FROM mysql.user;" 1

run_control "2.5" "Assurer l'utilisation de matériel cryptographique unique et non par défaut" "Les certificats numériques et les clés de chiffrement doivent être uniques pour chaque instance MariaDB." "Vérifier que les certificats ne sont pas auto-générés par défaut." "Les certificats sont générés par une autorité interne/externe et sont spécifiques au serveur." "openssl x509 -in server-cert.pem -subject -noout" 1

run_control "2.6" "S'assurer que 'password_lifetime' est inférieur ou égal à '365'" "L'expiration des mots de passe garantit qu'ils sont changés régulièrement." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where VARIABLE_NAME like 'default_password_lifetime';" "La valeur est <= 365." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where VARIABLE_NAME like 'default_password_lifetime';" 1

run_control "2.7" "Verrouiller les comptes non utilisés" "Désactiver les comptes inutilisés réduit la surface d'attaque." "Vérifier le statut verrouillé des comptes (account_locked)." "Les comptes non utilisés sont account_locked:true." "SELECT CONCAT(user, '@', host, ' => ', JSON_DETAILED(priv)) FROM mysql.global_priv;" 1

run_control "2.8" "Utiliser l'authentification par socket peer-credential de manière appropriée" "Le plugin unix_socket permet aux utilisateurs locaux de s'authentifier sans mot de passe." "SELECT PLUGIN_NAME, PLUGIN_STATUS FROM INFORMATION_SCHEMA.PLUGINS WHERE PLUGIN_NAME = 'unix_socket';" "Actif uniquement si la politique de l'entreprise l'autorise et restreint au localhost." "SELECT PLUGIN_NAME, PLUGIN_STATUS FROM INFORMATION_SCHEMA.PLUGINS WHERE PLUGIN_NAME = 'unix_socket';" 1

run_control "2.9" "S'assurer que MariaDB est lié à une adresse IP spécifique" "Limiter bind_address à une IP spécifique restreint les connexions TCP/IP." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME = 'bind_address';" "bind_address n'est pas vide et est lié à une IP interne/spécifique." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME = 'bind_address';" 1

run_control "2.10" "Limiter les versions TLS acceptées" "MariaDB supporte TLS. N'accepter que les versions fortes (1.2, 1.3)." "select @@tls_version;" "Ne contient pas TLSv1 ni TLSv1.1." "select @@tls_version;" 1

run_control "2.11" "Exiger des certificats côté client (X.509)" "Utiliser des certificats côté client valide l'identité." "select user, host, ssl_type from mysql.user where user not in ('mysql', 'root', 'mariadb.sys');" "ssl_type est X509." "select user, host, ssl_type from mysql.user;" 1

run_control "2.12" "S'assurer que seuls les chiffrements approuvés sont utilisés" "Forcer les chiffrements TLS forts." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME = 'ssl_cipher';" "Contient uniquement des algorithmes forts." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME = 'ssl_cipher';" 1

run_control "3.1" "S'assurer que 'datadir' a les permissions appropriées" "Le répertoire des données doit être restreint à l'utilisateur mysql." "sudo ls -ld <datadir> | grep \"drwxr-x---.*mysql.*mysql\"" "Permissions 750 (drwxr-x---) et propriétaire mysql:mysql." "show variables like 'datadir';" 1

run_control "3.2" "S'assurer que les fichiers 'log_bin_basename' ont les permissions appropriées" "Les fichiers binlogs contiennent des informations sensibles." "ls -l <log_bin_basename>*" "Permissions 660 et propriétaire mysql:mysql." "show variables like 'log_bin_basename';" 1

run_control "3.3" "S'assurer que 'log_error' a les permissions appropriées" "Le journal d'erreurs contient des détails sur l'exécution." "ls -l <log_error>" "Permissions 600 et propriétaire mysql:mysql." "show variables like 'log_error';" 1

run_control "3.4" "S'assurer que 'slow_query_log' a les permissions appropriées" "Le journal des requêtes lentes peut contenir des requêtes complètes." "ls -l <slow_query_log_file>" "Permissions 660, ou journal désactivé." "show variables like 'slow_query_log_file';" 1

run_control "3.5" "S'assurer que les fichiers 'relay_log_basename' ont les permissions appropriées" "Les fichiers relay logs sont utilisés dans la réplication." "ls -l <relay_log_basename>*" "Permissions 660 et propriétaire mysql:mysql." "show variables like 'relay_log_basename';" 1

run_control "3.6" "S'assurer que 'general_log_file' a les permissions appropriées" "Le journal général enregistre toutes les connexions et requêtes." "ls -l <general_log_file>" "Désactivé, ou permissions 600." "select @@general_log, @@general_log_file;" 1

run_control "3.7" "S'assurer que les clés SSL ont les permissions appropriées" "Les clés SSL privées doivent être fortement protégées." "ls -l <ssl_file>" "Permissions 400 et propriétaire mysql:mysql." "SELECT * FROM information_schema.global_variables WHERE REGEXP_INSTR(VARIABLE_NAME,'^.*ssl_(ca|capath|cert|crl|crlpath|key)$');" 1

run_control "3.8" "S'assurer que le dossier des plugins a les permissions appropriées" "Le répertoire des plugins charge du code tiers." "ls -ld <plugin_dir>" "Permissions 550 ou 554." "show variables where variable_name = 'plugin_dir';" 1

run_control "3.9" "S'assurer que 'server_audit_file_path' a les permissions appropriées" "Le journal d'audit est crucial pour la sécurité." "ls -l <server_audit_file_path>" "Permissions 660 et propriétaire mysql:mysql." "show global variables where variable_name='server_audit_file_path';" 1

run_control "3.10" "S'assurer que les fichiers de clé de chiffrement ont les permissions appropriées" "Les plugins de chiffrement stockent des clés (File Key Management)." "Vérifier file_key_management_filename et filekey." "Permissions 750 ou plus restrictives pour mysql:mysql." "grep -Po '(?<=file_key_management_filename=).+$' /etc/mysql/mariadb.cnf" 0

run_control "4.1" "S'assurer que les derniers correctifs de sécurité sont appliqués" "Les mises à jour corrigent les vulnérabilités." "SHOW VARIABLES WHERE Variable_name LIKE 'version';" "Version à jour." "SHOW VARIABLES WHERE Variable_name LIKE 'version';" 1

run_control "4.2" "S'assurer que les bases de test ou d'exemple ne sont pas installées" "Les bases de données de test augmentent la surface d'attaque." "SELECT * FROM information_schema.SCHEMATA;" "Aucune base 'test'." "SELECT * FROM information_schema.SCHEMATA where SCHEMA_NAME not in ('mysql','information_schema', 'sys', 'performance_schema');" 1

run_control "4.3" "S'assurer que 'allow-suspicious-udfs' est à 'OFF'" "Empêche l'ajout de fonctions définies par l'utilisateur (UDFs) suspectes." "my_print_defaults mysqld | grep allow-suspicious-udfs" "Doit être désactivé (OFF) et absent de la commande." "my_print_defaults mysqld | grep allow-suspicious-udfs" 0

run_control "4.4" "Durcir l'utilisation de 'local_infile' sur les clients" "local_infile permet de charger des fichiers locaux." "SHOW VARIABLES WHERE Variable_name = 'local_infile';" "La valeur est 0 (OFF)." "SHOW VARIABLES WHERE Variable_name = 'local_infile';" 1

run_control "4.5" "S'assurer que mariadb ne démarre pas avec 'skip-grant-tables'" "Démarre la base de données sans le système de privilèges." "Vérifier la configuration my.cnf pour skip-grant-tables." "Doit être FALSE ou absent." "grep skip-grant-tables /etc/mysql/mariadb.cnf" 0

run_control "4.6" "S'assurer que les liens symboliques sont désactivés" "Désactiver le support des liens symboliques pour les fichiers de base de données." "SHOW variables LIKE 'have_symlink';" "La valeur est DISABLED." "SHOW variables LIKE 'have_symlink';" 1

run_control "4.7" "S'assurer que 'secure_file_priv' est configuré" "Restreint LOAD DATA INFILE à un répertoire précis." "SHOW GLOBAL VARIABLES WHERE Variable_name = 'secure_file_priv';" "Un répertoire sécurisé valide, et non vide." "SHOW GLOBAL VARIABLES WHERE Variable_name = 'secure_file_priv';" 1

run_control "4.8" "S'assurer que 'sql_mode' contient 'STRICT_ALL_TABLES'" "Le mode strict rejette les requêtes avec des données invalides." "SHOW VARIABLES LIKE 'sql_mode';" "Doit inclure STRICT_ALL_TABLES." "SHOW VARIABLES LIKE 'sql_mode';" 1

run_control "4.9" "Activer le chiffrement au repos (data-at-rest encryption)" "Le chiffrement au repos protège les données stockées." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name like '%ENCRYPT%';" "innodb_encrypt_tables=ON et chiffrement activé." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name like '%ENCRYPT%';" 1

run_control "5.1" "Seuls les administrateurs ont un accès total" "Limiter les privilèges forts aux comptes administratifs." "select * from information_schema.user_privileges where grantee not like '\'mysql.%localhost\'';" "Seuls les comptes admins attendus sont retournés." "select * from information_schema.user_privileges where grantee not like '\'mysql.%localhost\'';" 1

run_control "5.2" "Le privilège 'FILE' n'est pas accordé aux utilisateurs non-admins" "Le privilège FILE permet de lire/écrire sur l'OS." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'FILE';" "Seuls les admins sont retournés." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'FILE';" 1

run_control "5.3" "Le privilège 'PROCESS' n'est pas accordé aux non-admins" "Le privilège PROCESS permet de voir les requêtes des autres." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'PROCESS';" "Seuls les admins sont retournés." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'PROCESS';" 1

run_control "5.4" "Le privilège 'SUPER' n'est pas accordé aux non-admins" "SUPER (ou les privilèges dynamiques) permet de modifier la configuration globale." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'SUPER';" "Seuls les admins sont retournés." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'SUPER';" 1

run_control "5.5" "Le privilège 'SHUTDOWN' n'est pas accordé aux non-admins" "Permet d'éteindre l'instance MariaDB." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'SHUTDOWN';" "Seuls les admins sont retournés." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'SHUTDOWN';" 1

run_control "5.6" "Le privilège 'CREATE USER' n'est pas accordé aux non-admins" "Permet de créer de nouveaux utilisateurs." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'CREATE USER';" "Seuls les admins sont retournés." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'CREATE USER';" 1

run_control "5.7" "Le privilège 'GRANT OPTION' n'est pas accordé aux non-admins" "Permet d'accorder ses propres privilèges à d'autres." "SELECT DISTINCT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE IS_GRANTABLE = 'YES';" "Seuls les admins sont retournés." "SELECT DISTINCT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE IS_GRANTABLE = 'YES';" 1

run_control "5.8" "Le privilège 'REPLICATION SLAVE' n'est pas accordé aux non-admins" "Permet de lire les flux de réplication (et donc toutes les données)." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'REPLICATION SLAVE';" "Seuls les comptes de réplication sont retournés." "SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'REPLICATION SLAVE';" 1

run_control "5.9" "Les privilèges DML/DDL sont limités à des bases spécifiques" "Limiter les privilèges de modification de données ou schémas à certaines bases." "SELECT User,Host,Db FROM mysql.db WHERE Select_priv='Y' OR Insert_priv='Y'..." "Chaque utilisateur n'a accès qu'à sa propre base." "SELECT User,Host,Db FROM mysql.db WHERE Select_priv='Y' OR Insert_priv='Y';" 1

run_control "5.10" "Définir de manière sécurisée DEFINER et INVOKER" "Les procédures stockées s'exécutent avec les droits de DEFINER ou INVOKER." "SHOW PROCEDURE STATUS; Vérifier le DEFINER." "Les procédures utilisent un DEFINER approprié et restreint." "SHOW PROCEDURE STATUS; SHOW FUNCTION STATUS;" 1

run_control "6.1" "S'assurer que 'log_error' est correctement configuré" "Le journal d'erreurs doit être activé vers un fichier et non stderr." "SHOW variables LIKE 'log_error';" "Un chemin de fichier valide, pas stderr." "SHOW variables LIKE 'log_error';" 1

run_control "6.2" "Les fichiers logs sont stockés sur une partition non système" "Déplacer les journaux hors de /var ou root pour éviter de remplir la partition OS." "SELECT @@global.log_bin_basename;" "Ne pointe pas sur la partition racine." "SELECT @@global.log_bin_basename;" 1

run_control "6.3" "S'assurer que 'log_warnings' est défini sur '2'" "Permet de journaliser les erreurs de communication réseau." "SHOW GLOBAL VARIABLES LIKE 'log_warnings';" "La valeur est 2." "SHOW GLOBAL VARIABLES LIKE 'log_warnings';" 1

run_control "6.4" "S'assurer que le journal d'audit est activé" "L'activation de l'audit permet de tracer qui fait quoi." "SHOW VARIABLES LIKE '%audit%';" "server_audit_logging est ON." "SHOW VARIABLES LIKE '%audit%';" 1

run_control "6.5" "Le plugin d'audit ne peut pas être déchargé" "S'assurer que personne ne peut arrêter l'audit dynamiquement." "SELECT LOAD_OPTION FROM information_schema.plugins WHERE PLUGIN_NAME='SERVER_AUDIT';" "FORCE_PLUS_PERMANENT." "SELECT LOAD_OPTION FROM information_schema.plugins WHERE PLUGIN_NAME='SERVER_AUDIT';" 1

run_control "6.6" "S'assurer que les Binary et Relay Logs sont chiffrés" "Chiffrer les binlogs au repos." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name like '%ENCRYPT_LOG%';" "ON pour le chiffrement des logs." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name like '%ENCRYPT_LOG%';" 1

run_control "7.1" "Désactiver l'utilisation du plugin mysql_old_password" "Les anciens mots de passe sont vulnérables." "SHOW VARIABLES WHERE Variable_name = 'old_passwords';" "OFF." "SHOW VARIABLES WHERE Variable_name = 'old_passwords';" 1

run_control "7.2" "Aucun mot de passe n'est stocké dans la configuration globale" "Les mots de passe dans mariadb.cnf sont lisibles par tous." "Vérifier mariadb.cnf pour la présence de mots de passe." "Aucun paramètre password." "grep password /etc/mysql/mariadb.cnf" 0

run_control "7.3" "Une authentification forte est utilisée pour tous les comptes" "Utiliser des plugins robustes (ed25519) au lieu de mysql_native_password." "SELECT User,host FROM mysql.user WHERE plugin IN('mysql_native_password', 'mysql_old_password');" "Aucune ligne retournée." "SELECT User,host FROM mysql.user WHERE plugin IN('mysql_native_password', 'mysql_old_password','');" 1

run_control "7.4" "Des politiques de complexité de mot de passe sont en place" "Utiliser le plugin simple_password_check ou cracklib." "SHOW VARIABLES LIKE '%pass%';" "Plugin actif et longueur minimale de 14." "SHOW VARIABLES LIKE '%pass%';" 1

run_control "7.5" "Aucun utilisateur n'a de nom d'hôte joker (wildcard)" "L'utilisation de '%' autorise la connexion depuis n'importe où." "SELECT user, host FROM mysql.user WHERE host = '%';" "Aucun compte retourné." "SELECT user, host FROM mysql.user WHERE host = '%';" 1

run_control "7.6" "Aucun compte anonyme n'existe" "Les comptes sans nom permettent à quiconque de se connecter." "SELECT user,host FROM mysql.user WHERE user = '';" "Aucun compte retourné." "SELECT user,host FROM mysql.user WHERE user = '';" 1

run_control "8.1" "S'assurer que require_secure_transport = ON et have_ssl = YES" "Tout trafic doit être chiffré." "select @@require_secure_transport; et SHOW variables WHERE variable_name = 'have_ssl';" "1 (ON) et YES." "select @@require_secure_transport; SHOW variables WHERE variable_name = 'have_ssl';" 1

run_control "8.2" "S'assurer que ssl_type exige SSL/TLS pour les utilisateurs distants" "Forcer le chiffrement par utilisateur." "SELECT user, host, ssl_type FROM mysql.user WHERE NOT HOST IN ('::1', '127.0.0.1', 'localhost');" "ssl_type doit être ANY, X509 ou SPECIFIED." "SELECT user, host, ssl_type FROM mysql.user WHERE NOT HOST IN ('::1', '127.0.0.1', 'localhost');" 1

run_control "8.3" "Fixer des limites de connexion maximales" "Limiter les connexions concurrentes." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME LIKE 'max_%connections';" "Des limites doivent être fixées, pas '0' ou infini." "SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME LIKE 'max_%connections';" 1

run_control "9.1" "Le trafic de réplication est sécurisé" "Chiffrer le trafic entre master et slave." "show replica status\G" "Master_SSL_Allowed est Yes." "show replica status\G" 1

run_control "9.2" "S'assurer que MASTER_SSL_VERIFY_SERVER_CERT est activé" "Le replica doit vérifier le certificat du serveur primaire." "show replica status\G" "Master_SSL_Verify_Server_Cert est Yes." "show replica status\G" 1

run_control "9.3" "Le privilège 'super_priv' n'est pas accordé aux utilisateurs de réplication" "Les utilisateurs de réplication n'ont pas besoin de privilèges super." "select user, host from mysql.user where user='repl' and Super_priv = 'Y';" "Aucune ligne retournée." "select user, host from mysql.user where user='repl' and Super_priv = 'Y';" 1

run_control "9.4" "Seuls les algorithmes approuvés sont utilisés pour la réplication" "S'assurer que le chiffrement de la réplication utilise des algorithmes forts." "SHOW REPLICA STATUS\G;" "Master_SSL_Cipher est approuvé." "SHOW REPLICA STATUS\G;" 1

run_control "9.5" "Le mutual TLS est activé" "Les deux serveurs s'authentifient l'un l'autre." "Vérifier Master_SSL_Cert et Master_SSL_Key." "Des certificats clients valides sont fournis au primaire." "SHOW REPLICA STATUS\G;" 1

echo "]" >> "$JSON_FILE"

# Rapport final en console
compliance_rate=0
if [ "$total_checks" -gt 0 ]; then
    compliance_rate=$(( (conforme_count * 100) / total_checks ))
fi

echo "----------------------------------------------------------------------"
echo -e "${BOLD}Rapport d'audit technique MariaDB généré avec succès !${NC}"
echo -e "Fichier TXT brut : ${REPORT_TXT}"
echo -e "Fichier JSON d'import : ${JSON_FILE}"
echo -e "Taux de conformité : ${BOLD}${compliance_rate}%${NC}"
echo "----------------------------------------------------------------------"
