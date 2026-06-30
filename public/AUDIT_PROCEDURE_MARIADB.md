# CIS MariaDB 10.6 Audit Procedure

This document describes the audit procedures for MariaDB 10.6 CIS Benchmark.

## 1.1 Placer les bases de données sur des partitions non système
**Description**: Les systèmes d'exploitation hôtes doivent inclure différentes partitions. La base de données doit être placée sur une partition non système.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME LIKE '%dir' or VARIABLE_NAME LIKE '%file'; Puis vérifier avec df -h

**Résultat Attendu**: Le répertoire ne doit pas être sur root (/), /var ou /usr.

**Remédiation**: Copier les données vers une nouvelle partition et configurer datadir.

---

## 1.2 Utiliser un compte dédié avec le moins de privilèges pour le service MariaDB
**Description**: Fournir un utilisateur dédié (mysql) sans droits d'administration.

**Procédure**: ps -ef | egrep "^mysql.*$"

**Résultat Attendu**: Le processus doit s'exécuter sous l'utilisateur mysql.

**Remédiation**: Créer un utilisateur dédié mysql sans accès shell.

---

## 1.3 Désactiver l'historique des commandes MariaDB
**Description**: Le client mysql écrit un historique dans .mysql_history. Ce fichier peut contenir des mots de passe.

**Procédure**: find /home -name ".mysql_history"; find /root -name ".mysql_history"

**Résultat Attendu**: Le fichier doit être lié à /dev/null.

**Remédiation**: Lier .mysql_history vers /dev/null ou définir MYSQL_HISTFILE.

---

## 1.4 Vérifier que la variable d'environnement MYSQL_PWD n'est pas utilisée
**Description**: MariaDB peut lire un mot de passe depuis MYSQL_PWD. Cela implique un mot de passe en clair.

**Procédure**: grep MYSQL_PWD /proc/*/environ

**Résultat Attendu**: Aucun résultat ne doit être retourné.

**Remédiation**: Utiliser une méthode plus sécurisée comme des certificats X509.

---

## 1.5 S'assurer que la connexion interactive est désactivée
**Description**: L'utilisateur MariaDB ne doit pas avoir un accès interactif au système d'exploitation.

**Procédure**: getent passwd mysql | egrep "^.*[\/bin\/false|\/sbin\/nologin]$"

**Résultat Attendu**: Le shell doit être /bin/false ou /sbin/nologin.

**Remédiation**: usermod -s /bin/false mysql

---

## 1.6 Vérifier que MYSQL_PWD n'est pas défini dans les profils utilisateurs
**Description**: MYSQL_PWD ne doit pas être présent dans .bashrc ou .profile.

**Procédure**: grep MYSQL_PWD /home/*/.{bashrc,profile,bash_profile}

**Résultat Attendu**: Aucun résultat attendu.

**Remédiation**: Supprimer MYSQL_PWD des scripts de profil.

---

## 1.7 S'assurer que MariaDB s'exécute dans un environnement Sandbox
**Description**: L'utilisation de chroot(), systemd isolation, ou docker met MariaDB dans un bac à sable.

**Procédure**: cat /etc/mysql | egrep '(?<=^chroot=).+$'

**Résultat Attendu**: Un chemin chroot valide doit être configuré.

**Remédiation**: Configurer chroot dans my.cnf ou utiliser systemd isolation.

---

## 2.1.1 Politique de sauvegarde en place
**Description**: Une politique de sauvegarde doit être documentée et planifiée.

**Procédure**: crontab -l

**Résultat Attendu**: Une planification de sauvegarde doit être listée.

**Remédiation**: Mettre en place des sauvegardes automatisées régulières.

---

## 2.1.2 Vérifier que les sauvegardes sont valides
**Description**: Les sauvegardes doivent être validées régulièrement.

**Procédure**: Vérifier les rapports de test de validation des sauvegardes.

**Résultat Attendu**: Rapports de validation réussie.

**Remédiation**: Implémenter des tests de restauration réguliers.

---

## 2.1.3 Sécuriser les identifiants de sauvegarde
**Description**: L'utilisateur de la base de données effectuant les sauvegardes doit utiliser des identifiants protégés.

**Procédure**: Vérifier les permissions des fichiers contenant les mots de passe et clés SSL.

**Résultat Attendu**: Permissions restrictives (ex: 600 ou 400).

**Remédiation**: Changer les permissions des fichiers.

---

## 2.1.4 Les sauvegardes doivent être correctement sécurisées
**Description**: Les sauvegardes contiennent toutes les données. Elles doivent être protégées par des permissions strictes et du chiffrement.

**Procédure**: Vérifier les permissions des fichiers de sauvegarde, le groupe, et si elles sont chiffrées.

**Résultat Attendu**: Les sauvegardes ne sont pas lisibles par tout le monde et sont chiffrées.

**Remédiation**: Utiliser mariabackup avec chiffrement et restreindre les permissions.

---

## 2.1.5 Récupération à un instant précis (Point-in-Time Recovery)
**Description**: Les binlogs permettent de restaurer à un instant précis.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name = 'binlog_expire_logs_seconds';

**Résultat Attendu**: La valeur ne doit pas être 0.

**Remédiation**: Activer les binlogs et configurer l'expiration.

---

## 2.1.6 Plan de reprise d'activité (DR)
**Description**: Une stratégie de reprise d'activité doit être planifiée.

**Procédure**: Vérifier l'existence d'un plan de reprise d'activité.

**Résultat Attendu**: Un plan DR existe et est testé.

**Remédiation**: Créer et tester un plan de reprise d'activité.

---

## 2.1.7 Sauvegarde de la configuration et des fichiers liés
**Description**: Les fichiers de configuration, certificats et UDFs doivent être sauvegardés.

**Procédure**: Vérifier que les fichiers my.cnf, certificats SSL, clés, logs d'audit sont sauvegardés.

**Résultat Attendu**: Les fichiers sont inclus dans la sauvegarde.

**Remédiation**: Ajouter les fichiers omis aux procédures de sauvegarde.

---

## 2.2 Dédier la machine exécutant MariaDB
**Description**: MariaDB doit être installé sur un serveur dédié.

**Procédure**: Vérifier qu'aucun autre service n'est installé.

**Résultat Attendu**: Seul MariaDB s'exécute.

**Remédiation**: Désinstaller les autres services ou rôles.

---

## 2.3 Ne pas spécifier de mots de passe en ligne de commande
**Description**: Les mots de passe passés via -p peuvent être visibles dans l'historique.

**Procédure**: Vérifier l'historique shell pour des commandes avec -p.

**Résultat Attendu**: Aucune commande MariaDB avec le mot de passe en clair.

**Remédiation**: Utiliser .mylogin.cnf ou saisir le mot de passe manuellement.

---

## 2.4 Ne pas réutiliser les noms d'utilisateur
**Description**: Les comptes de base de données ne doivent pas être réutilisés pour plusieurs applications ou utilisateurs.

**Procédure**: SELECT host, user, plugin FROM mysql.user;

**Résultat Attendu**: Chaque compte a un usage unique et spécifique.

**Remédiation**: Créer des comptes uniques pour chaque application/utilisateur.

---

## 2.5 Assurer l'utilisation de matériel cryptographique unique et non par défaut
**Description**: Les certificats numériques et les clés de chiffrement doivent être uniques pour chaque instance MariaDB.

**Procédure**: Vérifier que les certificats ne sont pas auto-générés par défaut.

**Résultat Attendu**: Les certificats sont générés par une autorité interne/externe et sont spécifiques au serveur.

**Remédiation**: Générer de nouveaux certificats et clés cryptographiques.

---

## 2.6 S'assurer que 'password_lifetime' est inférieur ou égal à '365'
**Description**: L'expiration des mots de passe garantit qu'ils sont changés régulièrement.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where VARIABLE_NAME like 'default_password_lifetime';

**Résultat Attendu**: La valeur est <= 365.

**Remédiation**: SET GLOBAL default_password_lifetime=365;

---

## 2.7 Verrouiller les comptes non utilisés
**Description**: Désactiver les comptes inutilisés réduit la surface d'attaque.

**Procédure**: Vérifier le statut verrouillé des comptes (account_locked).

**Résultat Attendu**: Les comptes non utilisés sont account_locked:true.

**Remédiation**: ALTER USER 'user'@'host' ACCOUNT LOCK;

---

## 2.8 Utiliser l'authentification par socket peer-credential de manière appropriée
**Description**: Le plugin unix_socket permet aux utilisateurs locaux de s'authentifier sans mot de passe.

**Procédure**: SELECT PLUGIN_NAME, PLUGIN_STATUS FROM INFORMATION_SCHEMA.PLUGINS WHERE PLUGIN_NAME = 'unix_socket';

**Résultat Attendu**: Actif uniquement si la politique de l'entreprise l'autorise et restreint au localhost.

**Remédiation**: unix_socket=OFF dans my.cnf si non requis, ou configurer correctement les utilisateurs.

---

## 2.9 S'assurer que MariaDB est lié à une adresse IP spécifique
**Description**: Limiter bind_address à une IP spécifique restreint les connexions TCP/IP.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME = 'bind_address';

**Résultat Attendu**: bind_address n'est pas vide et est lié à une IP interne/spécifique.

**Remédiation**: Ajouter bind_address=192.0.2.24 dans mariadb.cnf.

---

## 2.10 Limiter les versions TLS acceptées
**Description**: MariaDB supporte TLS. N'accepter que les versions fortes (1.2, 1.3).

**Procédure**: select @@tls_version;

**Résultat Attendu**: Ne contient pas TLSv1 ni TLSv1.1.

**Remédiation**: tls_version=TLSv1.2,TLSv1.3

---

## 2.11 Exiger des certificats côté client (X.509)
**Description**: Utiliser des certificats côté client valide l'identité.

**Procédure**: select user, host, ssl_type from mysql.user where user not in ('mysql', 'root', 'mariadb.sys');

**Résultat Attendu**: ssl_type est X509.

**Remédiation**: ALTER USER 'user'@'%' REQUIRE X509;

---

## 2.12 S'assurer que seuls les chiffrements approuvés sont utilisés
**Description**: Forcer les chiffrements TLS forts.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME = 'ssl_cipher';

**Résultat Attendu**: Contient uniquement des algorithmes forts.

**Remédiation**: Configurer ssl_cipher dans mariadb.cnf.

---

## 3.1 S'assurer que 'datadir' a les permissions appropriées
**Description**: Le répertoire des données doit être restreint à l'utilisateur mysql.

**Procédure**: sudo ls -ld <datadir> | grep "drwxr-x---.*mysql.*mysql"

**Résultat Attendu**: Permissions 750 (drwxr-x---) et propriétaire mysql:mysql.

**Remédiation**: chmod 750 <datadir>; chown mysql:mysql <datadir>

---

## 3.2 S'assurer que les fichiers 'log_bin_basename' ont les permissions appropriées
**Description**: Les fichiers binlogs contiennent des informations sensibles.

**Procédure**: ls -l <log_bin_basename>*

**Résultat Attendu**: Permissions 660 et propriétaire mysql:mysql.

**Remédiation**: chmod 660 <log file>; chown mysql:mysql <log file>

---

## 3.3 S'assurer que 'log_error' a les permissions appropriées
**Description**: Le journal d'erreurs contient des détails sur l'exécution.

**Procédure**: ls -l <log_error>

**Résultat Attendu**: Permissions 600 et propriétaire mysql:mysql.

**Remédiation**: chmod 600 <log file>; chown mysql:mysql <log file>

---

## 3.4 S'assurer que 'slow_query_log' a les permissions appropriées
**Description**: Le journal des requêtes lentes peut contenir des requêtes complètes.

**Procédure**: ls -l <slow_query_log_file>

**Résultat Attendu**: Permissions 660, ou journal désactivé.

**Remédiation**: Désactiver le slow query log ou définir chmod 660.

---

## 3.5 S'assurer que les fichiers 'relay_log_basename' ont les permissions appropriées
**Description**: Les fichiers relay logs sont utilisés dans la réplication.

**Procédure**: ls -l <relay_log_basename>*

**Résultat Attendu**: Permissions 660 et propriétaire mysql:mysql.

**Remédiation**: chmod 660 <log file>; chown mysql:mysql <log file>

---

## 3.6 S'assurer que 'general_log_file' a les permissions appropriées
**Description**: Le journal général enregistre toutes les connexions et requêtes.

**Procédure**: ls -l <general_log_file>

**Résultat Attendu**: Désactivé, ou permissions 600.

**Remédiation**: SET PERSIST @@GENERAL_LOG=OFF; ou chmod 600

---

## 3.7 S'assurer que les clés SSL ont les permissions appropriées
**Description**: Les clés SSL privées doivent être fortement protégées.

**Procédure**: ls -l <ssl_file>

**Résultat Attendu**: Permissions 400 et propriétaire mysql:mysql.

**Remédiation**: chmod 400 <ssl_file>; chown mysql:mysql <ssl_file>

---

## 3.8 S'assurer que le dossier des plugins a les permissions appropriées
**Description**: Le répertoire des plugins charge du code tiers.

**Procédure**: ls -ld <plugin_dir>

**Résultat Attendu**: Permissions 550 ou 554.

**Remédiation**: chmod 550 <plugin_dir>

---

## 3.9 S'assurer que 'server_audit_file_path' a les permissions appropriées
**Description**: Le journal d'audit est crucial pour la sécurité.

**Procédure**: ls -l <server_audit_file_path>

**Résultat Attendu**: Permissions 660 et propriétaire mysql:mysql.

**Remédiation**: chmod 660 <server_audit_file_path>

---

## 3.10 S'assurer que les fichiers de clé de chiffrement ont les permissions appropriées
**Description**: Les plugins de chiffrement stockent des clés (File Key Management).

**Procédure**: Vérifier file_key_management_filename et filekey.

**Résultat Attendu**: Permissions 750 ou plus restrictives pour mysql:mysql.

**Remédiation**: chmod 750 <file>

---

## 4.1 S'assurer que les derniers correctifs de sécurité sont appliqués
**Description**: Les mises à jour corrigent les vulnérabilités.

**Procédure**: SHOW VARIABLES WHERE Variable_name LIKE 'version';

**Résultat Attendu**: Version à jour.

**Remédiation**: Mettre à niveau MariaDB.

---

## 4.2 S'assurer que les bases de test ou d'exemple ne sont pas installées
**Description**: Les bases de données de test augmentent la surface d'attaque.

**Procédure**: SELECT * FROM information_schema.SCHEMATA;

**Résultat Attendu**: Aucune base 'test'.

**Remédiation**: DROP DATABASE test;

---

## 4.3 S'assurer que 'allow-suspicious-udfs' est à 'OFF'
**Description**: Empêche l'ajout de fonctions définies par l'utilisateur (UDFs) suspectes.

**Procédure**: my_print_defaults mysqld | grep allow-suspicious-udfs

**Résultat Attendu**: Doit être désactivé (OFF) et absent de la commande.

**Remédiation**: Retirer --allow-suspicious-udfs de la ligne de commande.

---

## 4.4 Durcir l'utilisation de 'local_infile' sur les clients
**Description**: local_infile permet de charger des fichiers locaux.

**Procédure**: SHOW VARIABLES WHERE Variable_name = 'local_infile';

**Résultat Attendu**: La valeur est 0 (OFF).

**Remédiation**: Désactiver local-infile=0 ou utiliser --load-data-local-dir.

---

## 4.5 S'assurer que mariadb ne démarre pas avec 'skip-grant-tables'
**Description**: Démarre la base de données sans le système de privilèges.

**Procédure**: Vérifier la configuration my.cnf pour skip-grant-tables.

**Résultat Attendu**: Doit être FALSE ou absent.

**Remédiation**: Retirer skip-grant-tables de la configuration.

---

## 4.6 S'assurer que les liens symboliques sont désactivés
**Description**: Désactiver le support des liens symboliques pour les fichiers de base de données.

**Procédure**: SHOW variables LIKE 'have_symlink';

**Résultat Attendu**: La valeur est DISABLED.

**Remédiation**: Définir skip-symbolic-links = YES dans la configuration.

---

## 4.7 S'assurer que 'secure_file_priv' est configuré
**Description**: Restreint LOAD DATA INFILE à un répertoire précis.

**Procédure**: SHOW GLOBAL VARIABLES WHERE Variable_name = 'secure_file_priv';

**Résultat Attendu**: Un répertoire sécurisé valide, et non vide.

**Remédiation**: Configurer secure_file_priv=/path/to/dir.

---

## 4.8 S'assurer que 'sql_mode' contient 'STRICT_ALL_TABLES'
**Description**: Le mode strict rejette les requêtes avec des données invalides.

**Procédure**: SHOW VARIABLES LIKE 'sql_mode';

**Résultat Attendu**: Doit inclure STRICT_ALL_TABLES.

**Remédiation**: Ajouter STRICT_ALL_TABLES dans sql_mode.

---

## 4.9 Activer le chiffrement au repos (data-at-rest encryption)
**Description**: Le chiffrement au repos protège les données stockées.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name like '%ENCRYPT%';

**Résultat Attendu**: innodb_encrypt_tables=ON et chiffrement activé.

**Remédiation**: Configurer le plugin file_key_management et activer le chiffrement InnoDB.

---

## 5.1 Seuls les administrateurs ont un accès total
**Description**: Limiter les privilèges forts aux comptes administratifs.

**Procédure**: select * from information_schema.user_privileges where grantee not like '\'mysql.%localhost\'';

**Résultat Attendu**: Seuls les comptes admins attendus sont retournés.

**Remédiation**: REVOKE des privilèges pour les utilisateurs non-admins.

---

## 5.2 Le privilège 'FILE' n'est pas accordé aux utilisateurs non-admins
**Description**: Le privilège FILE permet de lire/écrire sur l'OS.

**Procédure**: SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'FILE';

**Résultat Attendu**: Seuls les admins sont retournés.

**Remédiation**: REVOKE FILE ON *.* FROM '<user>';

---

## 5.3 Le privilège 'PROCESS' n'est pas accordé aux non-admins
**Description**: Le privilège PROCESS permet de voir les requêtes des autres.

**Procédure**: SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'PROCESS';

**Résultat Attendu**: Seuls les admins sont retournés.

**Remédiation**: REVOKE PROCESS ON *.* FROM '<user>';

---

## 5.4 Le privilège 'SUPER' n'est pas accordé aux non-admins
**Description**: SUPER (ou les privilèges dynamiques) permet de modifier la configuration globale.

**Procédure**: SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'SUPER';

**Résultat Attendu**: Seuls les admins sont retournés.

**Remédiation**: REVOKE SUPER ON *.* FROM '<user>';

---

## 5.5 Le privilège 'SHUTDOWN' n'est pas accordé aux non-admins
**Description**: Permet d'éteindre l'instance MariaDB.

**Procédure**: SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'SHUTDOWN';

**Résultat Attendu**: Seuls les admins sont retournés.

**Remédiation**: REVOKE SHUTDOWN ON *.* FROM '<user>';

---

## 5.6 Le privilège 'CREATE USER' n'est pas accordé aux non-admins
**Description**: Permet de créer de nouveaux utilisateurs.

**Procédure**: SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'CREATE USER';

**Résultat Attendu**: Seuls les admins sont retournés.

**Remédiation**: REVOKE CREATE USER ON *.* FROM '<user>';

---

## 5.7 Le privilège 'GRANT OPTION' n'est pas accordé aux non-admins
**Description**: Permet d'accorder ses propres privilèges à d'autres.

**Procédure**: SELECT DISTINCT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE IS_GRANTABLE = 'YES';

**Résultat Attendu**: Seuls les admins sont retournés.

**Remédiation**: REVOKE GRANT OPTION ON *.* FROM '<user>';

---

## 5.8 Le privilège 'REPLICATION SLAVE' n'est pas accordé aux non-admins
**Description**: Permet de lire les flux de réplication (et donc toutes les données).

**Procédure**: SELECT GRANTEE FROM INFORMATION_SCHEMA.USER_PRIVILEGES WHERE PRIVILEGE_TYPE = 'REPLICATION SLAVE';

**Résultat Attendu**: Seuls les comptes de réplication sont retournés.

**Remédiation**: REVOKE REPLICATION SLAVE ON *.* FROM '<user>';

---

## 5.9 Les privilèges DML/DDL sont limités à des bases spécifiques
**Description**: Limiter les privilèges de modification de données ou schémas à certaines bases.

**Procédure**: SELECT User,Host,Db FROM mysql.db WHERE Select_priv='Y' OR Insert_priv='Y'...

**Résultat Attendu**: Chaque utilisateur n'a accès qu'à sa propre base.

**Remédiation**: REVOKE privilèges globaux et GRANT sur bases spécifiques.

---

## 5.10 Définir de manière sécurisée DEFINER et INVOKER
**Description**: Les procédures stockées s'exécutent avec les droits de DEFINER ou INVOKER.

**Procédure**: SHOW PROCEDURE STATUS; Vérifier le DEFINER.

**Résultat Attendu**: Les procédures utilisent un DEFINER approprié et restreint.

**Remédiation**: Modifier les procédures pour utiliser un DEFINER sécurisé.

---

## 6.1 S'assurer que 'log_error' est correctement configuré
**Description**: Le journal d'erreurs doit être activé vers un fichier et non stderr.

**Procédure**: SHOW variables LIKE 'log_error';

**Résultat Attendu**: Un chemin de fichier valide, pas stderr.

**Remédiation**: Configurer log_error dans mariadb.cnf.

---

## 6.2 Les fichiers logs sont stockés sur une partition non système
**Description**: Déplacer les journaux hors de /var ou root pour éviter de remplir la partition OS.

**Procédure**: SELECT @@global.log_bin_basename;

**Résultat Attendu**: Ne pointe pas sur la partition racine.

**Remédiation**: Modifier log_bin vers un répertoire dédié.

---

## 6.3 S'assurer que 'log_warnings' est défini sur '2'
**Description**: Permet de journaliser les erreurs de communication réseau.

**Procédure**: SHOW GLOBAL VARIABLES LIKE 'log_warnings';

**Résultat Attendu**: La valeur est 2.

**Remédiation**: log_warnings = 2 dans la configuration.

---

## 6.4 S'assurer que le journal d'audit est activé
**Description**: L'activation de l'audit permet de tracer qui fait quoi.

**Procédure**: SHOW VARIABLES LIKE '%audit%';

**Résultat Attendu**: server_audit_logging est ON.

**Remédiation**: plugin_load_add=server_audit et server_audit_logging=ON

---

## 6.5 Le plugin d'audit ne peut pas être déchargé
**Description**: S'assurer que personne ne peut arrêter l'audit dynamiquement.

**Procédure**: SELECT LOAD_OPTION FROM information_schema.plugins WHERE PLUGIN_NAME='SERVER_AUDIT';

**Résultat Attendu**: FORCE_PLUS_PERMANENT.

**Remédiation**: server_audit=FORCE_PLUS_PERMANENT

---

## 6.6 S'assurer que les Binary et Relay Logs sont chiffrés
**Description**: Chiffrer les binlogs au repos.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables where variable_name like '%ENCRYPT_LOG%';

**Résultat Attendu**: ON pour le chiffrement des logs.

**Remédiation**: encrypt_binlog=ON

---

## 7.1 Désactiver l'utilisation du plugin mysql_old_password
**Description**: Les anciens mots de passe sont vulnérables.

**Procédure**: SHOW VARIABLES WHERE Variable_name = 'old_passwords';

**Résultat Attendu**: OFF.

**Remédiation**: old_passwords=0 et secure_auth=ON

---

## 7.2 Aucun mot de passe n'est stocké dans la configuration globale
**Description**: Les mots de passe dans mariadb.cnf sont lisibles par tous.

**Procédure**: Vérifier mariadb.cnf pour la présence de mots de passe.

**Résultat Attendu**: Aucun paramètre password.

**Remédiation**: Utiliser .mariadb.cnf ou mysql_config_editor.

---

## 7.3 Une authentification forte est utilisée pour tous les comptes
**Description**: Utiliser des plugins robustes (ed25519) au lieu de mysql_native_password.

**Procédure**: SELECT User,host FROM mysql.user WHERE plugin IN('mysql_native_password', 'mysql_old_password');

**Résultat Attendu**: Aucune ligne retournée.

**Remédiation**: ALTER USER pour utiliser ed25519 ou pam.

---

## 7.4 Des politiques de complexité de mot de passe sont en place
**Description**: Utiliser le plugin simple_password_check ou cracklib.

**Procédure**: SHOW VARIABLES LIKE '%pass%';

**Résultat Attendu**: Plugin actif et longueur minimale de 14.

**Remédiation**: Installer le plugin de validation de mots de passe.

---

## 7.5 Aucun utilisateur n'a de nom d'hôte joker (wildcard)
**Description**: L'utilisation de '%' autorise la connexion depuis n'importe où.

**Procédure**: SELECT user, host FROM mysql.user WHERE host = '%';

**Résultat Attendu**: Aucun compte retourné.

**Remédiation**: ALTER USER avec un nom d'hôte précis.

---

## 7.6 Aucun compte anonyme n'existe
**Description**: Les comptes sans nom permettent à quiconque de se connecter.

**Procédure**: SELECT user,host FROM mysql.user WHERE user = '';

**Résultat Attendu**: Aucun compte retourné.

**Remédiation**: DROP USER ''@'localhost';

---

## 8.1 S'assurer que require_secure_transport = ON et have_ssl = YES
**Description**: Tout trafic doit être chiffré.

**Procédure**: select @@require_secure_transport; et SHOW variables WHERE variable_name = 'have_ssl';

**Résultat Attendu**: 1 (ON) et YES.

**Remédiation**: Configurer require_secure_transport=ON.

---

## 8.2 S'assurer que ssl_type exige SSL/TLS pour les utilisateurs distants
**Description**: Forcer le chiffrement par utilisateur.

**Procédure**: SELECT user, host, ssl_type FROM mysql.user WHERE NOT HOST IN ('::1', '127.0.0.1', 'localhost');

**Résultat Attendu**: ssl_type doit être ANY, X509 ou SPECIFIED.

**Remédiation**: ALTER USER 'user'@'host' REQUIRE SSL;

---

## 8.3 Fixer des limites de connexion maximales
**Description**: Limiter les connexions concurrentes.

**Procédure**: SELECT VARIABLE_NAME, VARIABLE_VALUE FROM information_schema.global_variables WHERE VARIABLE_NAME LIKE 'max_%connections';

**Résultat Attendu**: Des limites doivent être fixées, pas '0' ou infini.

**Remédiation**: Configurer max_user_connections.

---

## 9.1 Le trafic de réplication est sécurisé
**Description**: Chiffrer le trafic entre master et slave.

**Procédure**: show replica status\G

**Résultat Attendu**: Master_SSL_Allowed est Yes.

**Remédiation**: CHANGE MASTER TO MASTER_SSL=1;

---

## 9.2 S'assurer que MASTER_SSL_VERIFY_SERVER_CERT est activé
**Description**: Le replica doit vérifier le certificat du serveur primaire.

**Procédure**: show replica status\G

**Résultat Attendu**: Master_SSL_Verify_Server_Cert est Yes.

**Remédiation**: CHANGE MASTER TO MASTER_SSL_VERIFY_SERVER_CERT=1;

---

## 9.3 Le privilège 'super_priv' n'est pas accordé aux utilisateurs de réplication
**Description**: Les utilisateurs de réplication n'ont pas besoin de privilèges super.

**Procédure**: select user, host from mysql.user where user='repl' and Super_priv = 'Y';

**Résultat Attendu**: Aucune ligne retournée.

**Remédiation**: REVOKE SUPER ON *.* FROM 'repl';

---

## 9.4 Seuls les algorithmes approuvés sont utilisés pour la réplication
**Description**: S'assurer que le chiffrement de la réplication utilise des algorithmes forts.

**Procédure**: SHOW REPLICA STATUS\G;

**Résultat Attendu**: Master_SSL_Cipher est approuvé.

**Remédiation**: CHANGE MASTER TO MASTER_SSL_CIPHER='ECDHE-ECDSA-AES128-GCM-SHA256';

---

## 9.5 Le mutual TLS est activé
**Description**: Les deux serveurs s'authentifient l'un l'autre.

**Procédure**: Vérifier Master_SSL_Cert et Master_SSL_Key.

**Résultat Attendu**: Des certificats clients valides sont fournis au primaire.

**Remédiation**: Configurer les certificats clients dans CHANGE MASTER TO.

---

