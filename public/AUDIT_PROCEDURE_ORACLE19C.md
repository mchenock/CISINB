# Procédure d'audit de sécurité CIS Oracle Database 19c

Ce document fournit la procédure d'audit basée sur le benchmark officiel **CIS Oracle Database 19c Benchmark v2.0.0**.

---

## 1. Oracle Database Installation And Patching Requirements

### 1.1 Mises à jour logicielles appropriées
* **Procédure :** 
  ```bash
  opatch lsinventory
  ```
* **Résultat Attendu :** Les correctifs récents doivent être appliqués.

---

## 2. Oracle Parameter Settings

### 2.3.1 BACKGROUND_CORE_DUMP
* **Procédure :** 
  ```sql
  SELECT UPPER(VALUE) FROM GV$SYSTEM_PARAMETER WHERE UPPER(NAME) = 'BACKGROUND_CORE_DUMP';
  ```
* **Résultat Attendu :** La valeur ne doit pas être FULL.
* **Remédiation :**
  ```sql
  ALTER SYSTEM SET BACKGROUND_CORE_DUMP='partial' SCOPE=BOTH;
  ```

### 2.3.5 OS_ROLES
* **Procédure :** 
  ```sql
  SELECT UPPER(VALUE) FROM GV$SYSTEM_PARAMETER WHERE UPPER(NAME) = 'OS_ROLES';
  ```
* **Résultat Attendu :** La valeur doit être FALSE.
* **Remédiation :**
  ```sql
  ALTER SYSTEM SET OS_ROLES = FALSE SCOPE = SPFILE;
  ```

### 2.3.11 REMOTE_LOGIN_PASSWORDFILE
* **Procédure :** 
  ```sql
  SELECT UPPER(VALUE) FROM GV$SYSTEM_PARAMETER WHERE UPPER(NAME) = 'REMOTE_LOGIN_PASSWORDFILE';
  ```
* **Résultat Attendu :** La valeur doit être NONE ou EXCLUSIVE.
* **Remédiation :**
  ```sql
  ALTER SYSTEM SET REMOTE_LOGIN_PASSWORDFILE = 'NONE' SCOPE = SPFILE;
  ```

---

## 3. Oracle Connection And Login Restrictions

### 3.1 FAILED_LOGIN_ATTEMPTS <= 5
* **Procédure :** 
  ```sql
  SELECT PROFILE, LIMIT FROM CDB_PROFILES WHERE RESOURCE_NAME='FAILED_LOGIN_ATTEMPTS';
  ```
* **Résultat Attendu :** La limite doit être inférieure ou égale à 5.
* **Remédiation :**
  ```sql
  ALTER PROFILE <profile_name> LIMIT FAILED_LOGIN_ATTEMPTS 5;
  ```

### 3.4 PASSWORD_REUSE_MAX = UNLIMITED
* **Procédure :** 
  ```sql
  SELECT PROFILE, LIMIT FROM CDB_PROFILES WHERE RESOURCE_NAME='PASSWORD_REUSE_MAX';
  ```
* **Résultat Attendu :** La limite doit être UNLIMITED.

---

## 4. Users

### 4.1 Changement des mots de passe par défaut
* **Procédure :** 
  ```sql
  SELECT USERNAME FROM CDB_USERS_WITH_DEFPWD;
  ```
* **Résultat Attendu :** Aucune ligne retournée (ou uniquement celles valides/documentées).

### 4.2 Aucun utilisateur personnalisé avec ORACLE_MAINTAINED='Y'
* **Procédure :** 
  ```sql
  SELECT USERNAME FROM CDB_USERS WHERE ORACLE_MAINTAINED = 'Y';
  ```
* **Résultat Attendu :** Seulement les comptes de système d'Oracle.

---

## 5. Audit/Logging

### 5.1.2 Audit des actions LOGON et LOGOFF
* **Procédure :** 
  ```sql
  SELECT AUDIT_OPTION FROM AUDIT_UNIFIED_POLICIES WHERE AUDIT_OPTION IN ('LOGON','LOGOFF');
  ```
* **Résultat Attendu :** Ces options doivent être trouvées et activées.

---

## 6. Privileges & Grants

### 6.2.1 Rôle DBA restreint
* **Procédure :** 
  ```sql
  SELECT GRANTEE FROM CDB_ROLE_PRIVS WHERE GRANTED_ROLE = 'DBA';
  ```
* **Résultat Attendu :** Uniquement des administrateurs de base de données autorisés.
* **Remédiation :**
  ```sql
  REVOKE DBA FROM <grantee>;
  ```
