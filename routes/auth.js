/**
 * routes/auth.js
 * 인증 관련 라우터
 *
 * POST /api/auth/login   → 로그인 (JWT 발급)
 * POST /api/auth/logout  → 로그아웃
 * GET  /api/auth/me      → 현재 로그인 사용자 정보 조회
 *
 * ※ 개발/테스트 모드:
 *   .env 에 DEV_MOCK_LOGIN=true 설정 시 DB 없이 누구나 로그인 가능
 *   실제 운영 전에 반드시 DEV_MOCK_LOGIN=false 로 변경하세요!
 */

const express  = require('express')
const jwt      = require('jsonwebtoken')
const bcrypt   = require('bcryptjs')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

// DEV_MOCK_LOGIN=true 이면 DB 없이 테스트 모드로 동작
const IS_MOCK = process.env.DEV_MOCK_LOGIN === 'true'

// ──────────────────────────────────────────────────────────────
// 공통 JWT 발급 헬퍼
// ──────────────────────────────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'mes_dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: 'MES-SYSTEM',
  })

// ──────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { userId: string, password: string }
// ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { userId, password } = req.body

  // ── 1. 입력값 검증 ──────────────────────────────────────
  if (!userId || !password) {
    return res.status(400).json({
      success: false,
      message: '아이디와 비밀번호를 입력해주세요.',
    })
  }

  // ════════════════════════════════════════════════════════
  // [테스트 모드] DEV_MOCK_LOGIN=true → DB 없이 즉시 토큰 발급
  // ════════════════════════════════════════════════════════
  if (IS_MOCK) {
    console.warn('[⚠️  MOCK LOGIN] DB 검증 없이 토큰 발급 - 개발 전용!')

    const payload = {
      userId,
      userNm: userId,   // 표시명은 아이디와 동일하게 세팅
      role:   'ADMIN',  // 테스트용 ADMIN 권한
      deptCd: 'DEV',
    }

    const token = signToken(payload)

    return res.status(200).json({
      success: true,
      message: '[테스트 모드] 로그인 성공 - 실제 DB 검증 없음',
      token,
      user: { ...payload },
    })
  }

  // ════════════════════════════════════════════════════════
  // [실제 모드] DB 조회 + bcrypt 검증
  // ════════════════════════════════════════════════════════
  try {
    const { getPool, sql } = require('../db')
    const pool = await getPool()

    // ── 2. DB 사용자 조회 ────────────────────────────────
    const result = await pool.request()
      .input('userId', sql.NVarChar(50), userId)
      .query(`
        SELECT
          USER_ID    AS userId,
          USER_NM    AS userNm,
          USER_PW    AS userPw,
          ROLE_CD    AS role,
          DEPT_CD    AS deptCd,
          USE_YN     AS useYn
        FROM TB_USER
        WHERE USER_ID = @userId
      `)

    // ── 3. 사용자 존재 여부 확인 ──────────────────────────
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
      })
    }

    const user = result.recordset[0]

    // ── 4. 계정 활성화 여부 확인 ──────────────────────────
    if (user.useYn !== 'Y') {
      return res.status(403).json({
        success: false,
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.',
      })
    }

    // ── 5. 비밀번호 검증 ─────────────────────────────────
    // bcrypt 해시 비교 (DB에 해시 저장 시):
    const isMatch = await bcrypt.compare(password, user.userPw)
    // 평문 비교 (DB에 평문 저장 시, 비권장):
    // const isMatch = (password === user.userPw)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
      })
    }

    // ── 6. JWT 토큰 생성 ─────────────────────────────────
    const payload = {
      userId: user.userId,
      userNm: user.userNm,
      role:   user.role   || 'USER',
      deptCd: user.deptCd || '',
    }

    const token = signToken(payload)

    // ── 7. 마지막 로그인 시간 업데이트 ───────────────────
    await pool.request()
      .input('userId', sql.NVarChar(50), userId)
      .query(`UPDATE TB_USER SET LAST_LOGIN_DT = GETDATE() WHERE USER_ID = @userId`)

    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      token,
      user: {
        userId: user.userId,
        userNm: user.userNm,
        role:   user.role   || 'USER',
        deptCd: user.deptCd || '',
      },
    })
  } catch (err) {
    console.error('[Login Error]', err)
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    })
  }
})

// ──────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ──────────────────────────────────────────────────────────────
router.post('/logout', authMiddleware, async (req, res) => {
  if (!IS_MOCK) {
    try {
      const { getPool, sql } = require('../db')
      const pool = await getPool()
      await pool.request()
        .input('userId', sql.NVarChar(50), req.user.userId)
        .query(`UPDATE TB_USER SET LAST_LOGOUT_DT = GETDATE() WHERE USER_ID = @userId`)
    } catch (err) {
      console.error('[Logout log error]', err.message)
    }
  }

  return res.status(200).json({
    success: true,
    message: '로그아웃 되었습니다.',
  })
})

// ──────────────────────────────────────────────────────────────
// GET /api/auth/me  (인증 필요)
// ──────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  // 테스트 모드: req.user 에 있는 페이로드 그대로 반환
  if (IS_MOCK) {
    return res.status(200).json({
      success: true,
      user: req.user,
    })
  }

  try {
    const { getPool, sql } = require('../db')
    const pool = await getPool()

    const result = await pool.request()
      .input('userId', sql.NVarChar(50), req.user.userId)
      .query(`
        SELECT
          USER_ID  AS userId,
          USER_NM  AS userNm,
          ROLE_CD  AS role,
          DEPT_CD  AS deptCd,
          EMAIL    AS email
        FROM TB_USER
        WHERE USER_ID = @userId AND USE_YN = 'Y'
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
    }

    return res.status(200).json({ success: true, user: result.recordset[0] })
  } catch (err) {
    console.error('[Me Error]', err)
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
  }
})

module.exports = router
