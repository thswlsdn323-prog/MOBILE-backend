-- ================================================
-- MES System DB 초기 설정 SQL
-- 대상 DB: MES_DB
-- ================================================

USE MES_DB
GO

-- ─── 사용자 테이블 ───────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TB_USER' AND xtype='U')
BEGIN
  CREATE TABLE TB_USER (
    USER_ID       NVARCHAR(50)   NOT NULL PRIMARY KEY,   -- 사용자 ID
    USER_NM       NVARCHAR(100)  NOT NULL,                -- 사용자명
    PASSWORD      NVARCHAR(255)  NOT NULL,                -- bcrypt 해시
    DEPT_CD       NVARCHAR(20)   NULL,                    -- 부서 코드
    DEPT_NM       NVARCHAR(100)  NULL,                    -- 부서명
    USE_YN        CHAR(1)        NOT NULL DEFAULT 'Y',    -- 사용 여부
    ADMIN_YN      CHAR(1)        NOT NULL DEFAULT 'N',    -- 관리자 여부
    LAST_LOGIN_DT DATETIME       NULL,                    -- 마지막 로그인
    REG_DT        DATETIME       NOT NULL DEFAULT GETDATE(),
    MOD_DT        DATETIME       NULL
  )
  PRINT 'TB_USER 테이블 생성 완료'
END
GO

-- ─── 초기 관리자 계정 insert ─────────────────────────
-- 비밀번호: admin1234 (bcrypt 해시)
-- ※ 실제 운영 시 반드시 비밀번호 변경!
IF NOT EXISTS (SELECT 1 FROM TB_USER WHERE USER_ID = 'admin')
BEGIN
  INSERT INTO TB_USER (USER_ID, USER_NM, PASSWORD, DEPT_CD, DEPT_NM, USE_YN, ADMIN_YN)
  VALUES (
    'admin',
    '시스템관리자',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin1234
    'SYS',
    '시스템팀',
    'Y',
    'Y'
  )
  PRINT '관리자 계정 생성 완료 (ID: admin / PW: admin1234)'
END
GO

-- ─── 테스트 일반 사용자 ──────────────────────────────
IF NOT EXISTS (SELECT 1 FROM TB_USER WHERE USER_ID = 'user01')
BEGIN
  INSERT INTO TB_USER (USER_ID, USER_NM, PASSWORD, DEPT_CD, DEPT_NM, USE_YN, ADMIN_YN)
  VALUES (
    'user01',
    '홍길동',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin1234
    'PROD',
    '생산팀',
    'Y',
    'N'
  )
  PRINT '테스트 사용자 생성 완료 (ID: user01 / PW: admin1234)'
END
GO

-- ─── 조회 확인 ───────────────────────────────────────
SELECT USER_ID, USER_NM, DEPT_NM, USE_YN, ADMIN_YN, REG_DT
FROM TB_USER
GO
