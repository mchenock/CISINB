-- ============================================================================
-- CIS Microsoft SQL Server 2022 Benchmark v1.3.0 - Security Audit Script
-- Generated for CIS Microsoft SQL Server 2022 Audit Portal
-- Language: T-SQL / SQL Server 2022
-- ============================================================================

USE [master];
GO

PRINT '============================================================================';
PRINT 'CIS Microsoft SQL Server 2022 Security Audit';
PRINT 'Generated: ' + CAST(GETDATE() as varchar);
PRINT '============================================================================';
PRINT '';

-- 1.1 SQL Server patch level
PRINT '[1.1] Patch Level and Security Updates:';
SELECT 
    SERVERPROPERTY('ProductLevel') as [SP_Installed], 
    SERVERPROPERTY('ProductVersion') as [Version],
    SERVERPROPERTY('ProductUpdateLevel') as [ProductUpdate_Level], 
    SERVERPROPERTY('ProductUpdateReference') as [KB_Number];
GO

-- 2.1 Ad Hoc Distributed Queries
PRINT '[2.1] Ad Hoc Distributed Queries:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'Ad Hoc Distributed Queries';
GO

-- 2.2 CLR Enabled
PRINT '[2.2] CLR Enabled:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'clr enabled';
GO

-- 2.3 Cross DB Ownership Chaining
PRINT '[2.3] Cross DB Ownership Chaining:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'cross db ownership chaining';
GO

-- 2.4 Database Mail XPs
PRINT '[2.4] Database Mail XPs:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'Database Mail XPs';
GO

-- 2.5 Ole Automation Procedures
PRINT '[2.5] Ole Automation Procedures:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'Ole Automation Procedures';
GO

-- 2.6 Remote Access
PRINT '[2.6] Remote Access:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'remote access';
GO

-- 2.7 Remote Admin Connections
PRINT '[2.7] Remote Admin Connections:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'remote admin connections';
GO

-- 2.8 Scan For Startup Procs
PRINT '[2.8] Scan For Startup Procs:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'scan for startup procs';
GO

-- 2.9 Trustworthy databases
PRINT '[2.9] TRUSTWORTHY Databases:';
SELECT name, is_trustworthy_on 
FROM sys.databases 
WHERE name != 'msdb';
GO

-- 2.11 SQL Server ports
PRINT '[2.11] Port config in registry:';
SELECT value_name, value_data 
FROM sys.dm_server_registry 
WHERE value_name IN ('TcpPort', 'TcpDynamicPorts');
GO

-- 2.12 Hide Instance status
PRINT '[2.12] Hide Instance status:';
DECLARE @getValue INT;
EXEC master.sys.xp_instance_regread 
    @rootkey = N'HKEY_LOCAL_MACHINE', 
    @key = N'SOFTWARE\Microsoft\Microsoft SQL Server\MSSQLServer\SuperSocketNetLib', 
    @value_name = N'HideInstance', 
    @value = @getValue OUTPUT;
SELECT @getValue as [HideInstance_Status];
GO

-- 2.13 sa account disabled status
PRINT '[2.13] sa account disabled status (sid=0x01):';
SELECT name, is_disabled 
FROM sys.server_principals 
WHERE sid = 0x01;
GO

-- 2.15 AUTO_CLOSE database setting
PRINT '[2.15] AUTO_CLOSE status on contained databases:';
SELECT name, containment, containment_desc, is_auto_close_on 
FROM sys.databases 
WHERE containment <> 0;
GO

-- 2.16 false sa login check
PRINT '[2.16] sa login account name presence check:';
SELECT name, principal_id 
FROM sys.server_principals 
WHERE name = 'sa';
GO

-- 2.17 clr strict security
PRINT '[2.17] clr strict security option:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'clr strict security';
GO

-- 3.1 Integrated security only mode
PRINT '[3.1] Is Integrated Security Only (1 = Windows Auth, 0 = Mixed Mode):';
SELECT SERVERPROPERTY('IsIntegratedSecurityOnly') as [login_mode];
GO

-- 3.2 CONNECT permission on guest user in user databases
PRINT '[3.2] CONNECT permission on guest user:';
SELECT DB_NAME() AS DatabaseName, name, type_desc 
FROM sys.database_principals 
WHERE name = 'guest';
GO

-- 3.3 Orphaned users
PRINT '[3.3] Orphaned database users:';
SELECT name 
FROM sys.database_principals 
WHERE type_desc IN ('SQL_USER', 'WINDOWS_USER') 
  AND sid NOT IN (SELECT sid FROM sys.server_principals);
GO

-- 3.8 public server role permissions
PRINT '[3.8] public server role permissions:';
SELECT * 
FROM master.sys.server_permissions 
WHERE grantee_principal_id = SUSER_SID(N'public') 
  AND state_desc LIKE 'GRANT%';
GO

-- 3.9 BUILTIN groups check
PRINT '[3.9] BUILTIN logins check:';
SELECT name, type_desc 
FROM sys.server_principals 
WHERE name LIKE 'BUILTIN%';
GO

-- 3.12 sysadmin members
PRINT '[3.12] sysadmin members check:';
SELECT name, type_desc 
FROM sys.server_principals 
WHERE IS_SRVROLEMEMBER('sysadmin', name) = 1;
GO

-- 4.2 CHECK_EXPIRATION status
PRINT '[4.2] Logins with CHECK_EXPIRATION = OFF:';
SELECT name, is_expiration_checked 
FROM sys.sql_logins 
WHERE is_disabled = 0;
GO

-- 4.3 CHECK_POLICY status
PRINT '[4.3] Logins with CHECK_POLICY = OFF:';
SELECT name, is_policy_checked 
FROM sys.sql_logins 
WHERE is_disabled = 0;
GO

-- 5.1 Number of Error Log Files config
PRINT '[5.1] Number of Error Log Files:';
DECLARE @NumErrorLogs int;
EXEC master.sys.xp_instance_regread 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'NumErrorLogs', 
    @NumErrorLogs OUTPUT;
SELECT ISNULL(@NumErrorLogs, -1) AS [NumberOfLogFiles];
GO

-- 5.2 Default Trace Enabled
PRINT '[5.2] Default Trace Enabled:';
SELECT name, CAST(value as int) as value_configured, CAST(value_in_use as int) as value_in_use 
FROM sys.configurations 
WHERE name = 'default trace enabled';
GO

-- 5.3 Login Auditing level
PRINT '[5.3] Login Auditing Level config:';
EXEC xp_loginconfig 'audit level';
GO

-- 5.4 SQL Server Auditing specifications
PRINT '[5.4] SQL Server Audit and Server Audit Specifications status:';
SELECT 
    S.name AS [Audit Name], 
    S.is_state_enabled AS [Audit Enabled], 
    SA.name AS [Specification Name], 
    SA.is_state_enabled AS [Spec Enabled] 
FROM sys.server_audits S 
JOIN sys.server_audit_specifications SA ON SA.audit_guid = S.audit_guid;
GO

-- 6.2 CLR assembly permission set
PRINT '[6.2] CLR assemblies permission sets (SAFE / EXTERNAL / UNSAFE):';
SELECT name, permission_set_desc 
FROM sys.assemblies 
WHERE is_user_defined = 1;
GO

-- 7.1 Symmetric keys algorithms in non-system databases
PRINT '[7.1] Symmetric key encryption algorithms in databases:';
SELECT name, algorithm_desc 
FROM sys.symmetric_keys 
WHERE db_id() > 4;
GO

-- 7.2 Asymmetric key lengths in non-system databases
PRINT '[7.2] Asymmetric key lengths:';
SELECT name, key_length 
FROM sys.asymmetric_keys 
WHERE db_id() > 4;
GO

-- 7.5 Transparent Data Encryption (TDE) status
PRINT '[7.5] TDE encrypted databases check (is_encrypted = 1):';
SELECT database_id, name, is_encrypted 
FROM sys.databases 
WHERE database_id > 4;
GO

PRINT '============================================================================';
PRINT 'End of Security Audit';
PRINT '============================================================================';
GO
