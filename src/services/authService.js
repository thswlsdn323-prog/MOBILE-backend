const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getPool, sql } = require('../config/db')

const IS_MOCK = process.env.DEV_MOCK_LOGIN === 'true'

// 서버 재시작 시 초기화됨 — 실운영은 DB 테이블로 교체
const refreshTokenStore = new Set()

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  })

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })

const loginService = async (userId, password, COMP, FACT) => {
  if (IS_MOCK) {
    console.warn('[⚠️  MOCK LOGIN] DB 검증 없이 토큰 발급 - 개발 전용!')
    const payload = { userId, userNm: userId, COMP, FACT, deptCd: 'DEV', deptNm: '개발팀', adminYn: 'Y' }
    const accessToken  = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)
    refreshTokenStore.add(refreshToken)
    return { accessToken, refreshToken, user: payload }
  }

  const pool = getPool()

  const result = await pool.request()
    .input('userId', sql.NVarChar(50), userId)
    .query(`
      SELECT USER_ID, USER_NM, PASSWORD, DEPT_CD, DEPT_NM, USE_YN, ADMIN_YN
      FROM TB_USER
      WHERE USER_ID = @userId
    `)

  const user = result.recordset[0]

  if (!user) {
    const err = new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
    err.status = 401
    throw err
  }

  if (user.USE_YN !== 'Y') {
    const err = new Error('비활성화된 계정입니다. 관리자에게 문의하세요.')
    err.status = 403
    throw err
  }

  const isValid = await bcrypt.compare(password, user.PASSWORD)
  if (!isValid) {
    const err = new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
    err.status = 401
    throw err
  }

  await pool.request()
    .input('userId', sql.NVarChar(50), userId)
    .query(`UPDATE TB_USER SET LAST_LOGIN_DT = GETDATE() WHERE USER_ID = @userId`)

  const payload = {
    userId: user.USER_ID,
    userNm: user.USER_NM,
    COMP,
    FACT,
    deptCd: user.DEPT_CD,
    deptNm: user.DEPT_NM,
    adminYn: user.ADMIN_YN,
  }

  const accessToken  = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  refreshTokenStore.add(refreshToken)

  return {
    accessToken,
    refreshToken,
    user: {
      userId: user.USER_ID,
      userNm: user.USER_NM,
      COMP,
      FACT,
      deptCd: user.DEPT_CD,
      deptNm: user.DEPT_NM,
      adminYn: user.ADMIN_YN,
    },
  }
}

const refreshService = (refreshToken) => {
  if (!refreshToken || !refreshTokenStore.has(refreshToken)) {
    const err = new Error('유효하지 않은 리프레시 토큰입니다.')
    err.status = 401
    throw err
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    )
    const { userId, userNm, COMP, FACT, deptCd, deptNm, adminYn } = decoded
    const accessToken = signAccessToken({ userId, userNm, COMP, FACT, deptCd, deptNm, adminYn })
    return { accessToken }
  } catch {
    refreshTokenStore.delete(refreshToken)
    const err = new Error('리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.')
    err.status = 401
    throw err
  }
}

const logoutService = (refreshToken) => {
  if (refreshToken) refreshTokenStore.delete(refreshToken)
}

const getMeService = async (userId) => {
  if (IS_MOCK) return null

  const pool = getPool()
  const result = await pool.request()
    .input('userId', sql.NVarChar(50), userId)
    .query(`
      SELECT USER_ID, USER_NM, DEPT_CD, DEPT_NM, ADMIN_YN, LAST_LOGIN_DT
      FROM TB_USER
      WHERE USER_ID = @userId
    `)

  return result.recordset[0]
}

module.exports = { loginService, refreshService, logoutService, getMeService }
