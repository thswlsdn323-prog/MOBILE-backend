const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getPool, sql } = require('../config/db')

// 로그인
const loginService = async (userId, password) => {
  const pool = getPool()

  // 사용자 조회
  const result = await pool.request()
    .input('userId', sql.NVarChar(50), userId)
    .query(`
      SELECT 
        USER_ID,
        USER_NM,
        PASSWORD,
        DEPT_CD,
        DEPT_NM,
        USE_YN,
        ADMIN_YN
      FROM TB_USER
      WHERE USER_ID = @userId
    `)

  const user = result.recordset[0]

  // 사용자 없음
  if (!user) {
    const err = new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
    err.status = 401
    throw err
  }

  // 사용 여부 확인
  if (user.USE_YN !== 'Y') {
    const err = new Error('비활성화된 계정입니다. 관리자에게 문의하세요.')
    err.status = 403
    throw err
  }

  // 비밀번호 검증 (bcrypt)
  const isValid = await bcrypt.compare(password, user.PASSWORD)
  if (!isValid) {
    const err = new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
    err.status = 401
    throw err
  }

  // 마지막 로그인 시간 업데이트
  await pool.request()
    .input('userId', sql.NVarChar(50), userId)
    .query(`
      UPDATE TB_USER 
      SET LAST_LOGIN_DT = GETDATE() 
      WHERE USER_ID = @userId
    `)

  // JWT 토큰 생성
  const token = jwt.sign(
    {
      userId: user.USER_ID,
      userNm: user.USER_NM,
      deptCd: user.DEPT_CD,
      deptNm: user.DEPT_NM,
      adminYn: user.ADMIN_YN,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )

  return {
    token,
    user: {
      userId: user.USER_ID,
      userNm: user.USER_NM,
      deptCd: user.DEPT_CD,
      deptNm: user.DEPT_NM,
      adminYn: user.ADMIN_YN,
    },
  }
}

// 내 정보 조회
const getMeService = async (userId) => {
  const pool = getPool()

  const result = await pool.request()
    .input('userId', sql.NVarChar(50), userId)
    .query(`
      SELECT 
        USER_ID,
        USER_NM,
        DEPT_CD,
        DEPT_NM,
        ADMIN_YN,
        LAST_LOGIN_DT
      FROM TB_USER
      WHERE USER_ID = @userId
    `)

  return result.recordset[0]
}

module.exports = { loginService, getMeService }
