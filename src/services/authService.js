const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getPool, sql } = require('../config/db')

// DEV_MOCK_LOGIN=true 이면 DB 없이 누구나 로그인 가능 (테스트 전용)
const IS_MOCK = process.env.DEV_MOCK_LOGIN === 'true'

// 공통 JWT 발급
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  })

// 로그인
const loginService = async (userId, password) => {

  // ════════════════════════════════════════════════════════
  // [테스트 모드] DB 없이 즉시 토큰 발급
  // ════════════════════════════════════════════════════════
  if (IS_MOCK) {
    console.warn('[⚠️  MOCK LOGIN] DB 검증 없이 토큰 발급 - 개발 전용!')

    const payload = {
      userId,
      userNm: userId,
      deptCd: 'DEV',
      deptNm: '개발팀',
      adminYn: 'Y',
    }

    return {
      token: signToken(payload),
      user: { ...payload },
    }
  }

  // ════════════════════════════════════════════════════════
  // [실제 모드] DB 조회 + bcrypt 검증
  // ════════════════════════════════════════════════════════
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
  const payload = {
    userId: user.USER_ID,
    userNm: user.USER_NM,
    deptCd: user.DEPT_CD,
    deptNm: user.DEPT_NM,
    adminYn: user.ADMIN_YN,
  }

  return {
    token: signToken(payload),
    user: { ...payload },
  }
}

// 내 정보 조회
const getMeService = async (userId) => {
  // 테스트 모드: req.user 에서 이미 페이로드 가지고 있으므로 컨트롤러에서 처리
  if (IS_MOCK) return null

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
