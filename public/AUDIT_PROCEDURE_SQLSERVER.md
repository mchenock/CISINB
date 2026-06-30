# Procédure d'audit de sécurité CIS Microsoft SQL Server 2022

Ce document fournit la procédure d'audit complète basée sur le benchmark officiel **CIS Microsoft SQL Server 2022 Benchmark v1.3.0**.

---

## 1. Installation, Mises à jour et Patches

### 1.1 S'assurer que les dernières mises à jour cumulatives (CU) et correctifs sont installés (Manuel)
Exécuter la requête suivante pour lister les niveaux de patch installés :
```sql
SELECT 
    SERVERPROPERTY('ProductLevel') as SP_installed, 
    SERVERPROPERTY('ProductVersion') as Version,
    SERVERPROPERTY('ProductUpdateLevel') as 'ProductUpdate_Level', 
    SERVERPROPERTY('ProductUpdateReference') as 'KB_Number';
```
* **Résultat Attendu :** Les valeurs doivent correspondre aux dernières versions publiées par Microsoft validées par votre entreprise.

### 1.2 S'assurer d'utiliser des serveurs dédiés à fonction unique (Manuel)
* **Procédure :** Inspecter l'OS pour s'assurer que SQL Server ne cohabite pas avec d'autres rôles majeurs (IIS, DNS, AD DS, etc.).

---

## 2. Réduction de la surface d'attaque (Surface Area Reduction)

### 2.1 Option de configuration 'Ad Hoc Distributed Queries' à 0
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'Ad Hoc Distributed Queries';
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0`.
* **Remédiation :**
```sql
EXECUTE sp_configure 'show advanced options', 1; RECONFIGURE;
EXECUTE sp_configure 'Ad Hoc Distributed Queries', 0; RECONFIGURE;
EXECUTE sp_configure 'show advanced options', 0; RECONFIGURE;
```

### 2.2 Option de configuration 'CLR Enabled' à 0
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'clr enabled';
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0` (sauf dérogation).
* **Remédiation :**
```sql
EXECUTE sp_configure 'clr enabled', 0; RECONFIGURE;
```

### 2.3 Option de configuration 'Cross DB Ownership Chaining' à 0
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'cross db ownership chaining';
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0`.
* **Remédiation :**
```sql
EXECUTE sp_configure 'cross db ownership chaining', 0; RECONFIGURE;
```

### 2.4 Option de configuration 'Database Mail XPs' à 0
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'Database Mail XPs';
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0`.
* **Remédiation :**
```sql
EXECUTE sp_configure 'show advanced options', 1; RECONFIGURE;
EXECUTE sp_configure 'Database Mail XPs', 0; RECONFIGURE;
EXECUTE sp_configure 'show advanced options', 0; RECONFIGURE;
```

### 2.5 Option de configuration 'Ole Automation Procedures' à 0
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'Ole Automation Procedures';
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0`.
* **Remédiation :**
```sql
EXECUTE sp_configure 'show advanced options', 1; RECONFIGURE;
EXECUTE sp_configure 'Ole Automation Procedures', 0; RECONFIGURE;
EXECUTE sp_configure 'show advanced options', 0; RECONFIGURE;
```

### 2.6 Option de configuration 'Remote Access' à 0
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'remote access';
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0`.
* **Remédiation :**
```sql
EXECUTE sp_configure 'show advanced options', 1; RECONFIGURE;
EXECUTE sp_configure 'remote access', 0; RECONFIGURE;
EXECUTE sp_configure 'show advanced options', 0; RECONFIGURE;
```

### 2.7 Option de configuration 'Remote Admin Connections' à 0 (Non-cluster)
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'remote admin connections' AND SERVERPROPERTY('IsClustered') = 0;
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0` si non-cluster.

### 2.8 Option de configuration 'Scan For Startup Procs' à 0
Vérifier l'état de l'option :
```sql
SELECT name, value_configured, value_in_use 
FROM sys.configurations 
WHERE name = 'scan for startup procs';
```
* **Résultat Attendu :** Les deux valeurs doivent être à `0`.

### 2.9 Option 'Trustworthy' à OFF
Vérifier l'état par base :
```sql
SELECT name FROM sys.databases WHERE is_trustworthy_on = 1 AND name != 'msdb';
```
* **Résultat Attendu :** Aucune ligne (hors msdb) retournée.

### 2.13 Compte de connexion 'sa' désactivé
Vérifier l'état du compte :
```sql
SELECT name, is_disabled FROM sys.server_principals WHERE sid = 0x01;
```
* **Résultat Attendu :** `is_disabled = 1`.

---

## 3. Authentification et Autorisations

### 3.1 Mode d'authentification Windows exclusive
Vérifier l'état de l'authentification intégrée :
```sql
SELECT SERVERPROPERTY('IsIntegratedSecurityOnly') as [login_mode];
```
* **Résultat Attendu :** Doit retourner `1` (Windows Authentication uniquement).

### 3.2 Droit CONNECT révoqué sur l'utilisateur 'guest'
Vérifier les privilèges du rôle guest :
```sql
SELECT DB_NAME() AS DatabaseName, name 
FROM sys.database_principals 
WHERE name = 'guest';
```
* **Résultat Attendu :** Pas de droit CONNECT accordé sur les bases de données métier.

### 3.9 Pas d'utilisation des groupes BUILTIN\\Administrators
Vérifier les logins :
```sql
SELECT name FROM sys.server_principals WHERE name like 'BUILTIN%';
```
* **Résultat Attendu :** Aucune ligne BUILTIN comme login.

---

## 4. Politiques de mot de passe (Password Policies)

### 4.2 CHECK_EXPIRATION activé sur les logins SQL
Vérifier l'état d'expiration :
```sql
SELECT name, is_expiration_checked FROM sys.sql_logins WHERE is_disabled = 0;
```
* **Résultat Attendu :** `is_expiration_checked = 1` pour les logins actifs.

### 4.3 CHECK_POLICY activé sur les logins SQL
Vérifier l'état des politiques :
```sql
SELECT name, is_policy_checked FROM sys.sql_logins WHERE is_disabled = 0;
```
* **Résultat Attendu :** `is_policy_checked = 1`.

---

## 5. Audit et Logging

### 5.1 Nombre max de fichiers Error Logs >= 12
Vérifier la configuration du registre :
```sql
DECLARE @NumErrorLogs int;
EXEC master.sys.xp_instance_regread 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'NumErrorLogs', 
    @NumErrorLogs OUTPUT;
SELECT ISNULL(@NumErrorLogs, -1) AS [NumberOfLogFiles];
```
* **Résultat Attendu :** Nombre >= `12`.

### 5.2 Trace par défaut activée (Default Trace)
```sql
SELECT name, value_in_use FROM sys.configurations WHERE name = 'default trace enabled';
```
* **Résultat Attendu :** `value_in_use = 1`.

---

## 7. Chiffrement (Encryption)

### 7.5 Chiffrement transparent TDE (Transparent Data Encryption) actif
Vérifier l'état de chiffrement des bases de données :
```sql
select database_id, name, is_encrypted from sys.databases where database_id > 4;
```
* **Résultat Attendu :** Les bases métier affichent `is_encrypted = 1`.
