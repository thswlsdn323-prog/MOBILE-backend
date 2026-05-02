/**
 * authMiddleware.js
 * JWT 토큰 검증 미들웨어
 *
 * Authorization: Bearer <token> 헤더를 파싱하여
 * 토큰이 유효하면 req.user 에 페이로드를 주입하고 next() 호출
 * 유효하지 않으면 401/403 응답 반환
 */

const jwt = require('jsonwebtoken')

/**
 * JWT 인증 미들웨어
 * 보호가 필요한 라우터에 use() 또는 개별 라우트에 인수로 전달
 */
const authMiddleware = (req, res, next) => {
  // ── 1. Authorization 헤더 추출 ──────────────────────────
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 없습니다. 로그인이 필요합니다.',
    })
  }

  // ── 2. "Bearer " 제거 후 순수 토큰 추출 ────────────────
  const token = authHeader.split(' ')[1]

  // ── 3. 토큰 검증 ────────────────────────────────────────
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // req.user 에 디코딩된 페이로드 주입 (이후 라우터에서 사용 가능)
    req.user = {
      userId: decoded.userId,
      userNm: decoded.userNm,
      role:   decoded.role,
      deptCd: decoded.deptCd,
    }

    next()
  } catch (err) {
    // 만료된 토큰
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해 주세요.',
        code: 'TOKEN_EXPIRED',
      })
    }

    // 서명 불일치, 형식 오류 등
    return res.status(403).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
      code: 'TOKEN_INVALID',
    })
  }
}

/**
 * 역할(role) 기반 접근 제어 미들웨어 팩토리
 * 사용 예: router.get('/admin', authMiddleware, requireRole('ADMIN'), handler)
 * @param {...string} roles - 허용할 역할 목록
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '인증이 필요합니다.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다.',
        required: roles,
        current: req.user.role,
      })
    }

    next()
  }
}

module.exports = { authMiddleware, requireRole }
