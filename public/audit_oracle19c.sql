-- ============================================================================
-- CIS Oracle Database 19c Benchmark v2.0.0 - Security Audit Script
-- Generated for CIS Oracle 19c Audit Portal
-- Language: SQL / Oracle
-- ============================================================================

SET PAGESIZE 1000
SET LINESIZE 200
SET FEEDBACK OFF

PROMPT ============================================================================
PROMPT CIS Oracle Database 19c Security Audit
PROMPT ============================================================================
PROMPT 

-- 2.3.1 BACKGROUND_CORE_DUMP
PROMPT [2.3.1] BACKGROUND_CORE_DUMP configuration:
SELECT UPPER(NAME) AS PARAMETER, UPPER(VALUE) AS VALUE 
FROM GV$SYSTEM_PARAMETER 
WHERE UPPER(NAME) = 'BACKGROUND_CORE_DUMP';

-- 2.3.5 OS_ROLES
PROMPT [2.3.5] OS_ROLES configuration:
SELECT UPPER(NAME) AS PARAMETER, UPPER(VALUE) AS VALUE 
FROM GV$SYSTEM_PARAMETER 
WHERE UPPER(NAME) = 'OS_ROLES';

-- 2.3.11 REMOTE_LOGIN_PASSWORDFILE
PROMPT [2.3.11] REMOTE_LOGIN_PASSWORDFILE configuration:
SELECT UPPER(NAME) AS PARAMETER, UPPER(VALUE) AS VALUE 
FROM GV$SYSTEM_PARAMETER 
WHERE UPPER(NAME) = 'REMOTE_LOGIN_PASSWORDFILE';

-- 3.1 FAILED_LOGIN_ATTEMPTS
PROMPT [3.1] Profiles with FAILED_LOGIN_ATTEMPTS:
SELECT PROFILE, RESOURCE_NAME, LIMIT 
FROM CDB_PROFILES 
WHERE RESOURCE_NAME='FAILED_LOGIN_ATTEMPTS';

-- 3.4 PASSWORD_REUSE_MAX
PROMPT [3.4] Profiles with PASSWORD_REUSE_MAX:
SELECT PROFILE, RESOURCE_NAME, LIMIT 
FROM CDB_PROFILES 
WHERE RESOURCE_NAME='PASSWORD_REUSE_MAX';

-- 4.1 Default Passwords
PROMPT [4.1] Users with Default Passwords:
SELECT USERNAME 
FROM CDB_USERS_WITH_DEFPWD;

-- 4.2 Custom ORACLE_MAINTAINED
PROMPT [4.2] Users with ORACLE_MAINTAINED = Y:
SELECT USERNAME, ORACLE_MAINTAINED 
FROM CDB_USERS 
WHERE ORACLE_MAINTAINED = 'Y';

-- 5.1.2 LOGON/LOGOFF Auditing
PROMPT [5.1.2] LOGON/LOGOFF Auditing Policies:
SELECT POLICY_NAME, AUDIT_OPTION 
FROM AUDIT_UNIFIED_POLICIES 
WHERE AUDIT_OPTION IN ('LOGON','LOGOFF');

-- 6.2.1 DBA Role Grants
PROMPT [6.2.1] DBA Role Grants:
SELECT GRANTEE, GRANTED_ROLE 
FROM CDB_ROLE_PRIVS 
WHERE GRANTED_ROLE = 'DBA';

PROMPT ============================================================================
PROMPT End of Security Audit
PROMPT ============================================================================
EXIT;
