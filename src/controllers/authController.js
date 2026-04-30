const { loginService, getMeService } = require('../services/authService')

// POST /api/auth/login
const login = async (req, res) => {
  const { userId, password } = req.body

  if (!userId || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' })
  }

  const data = await loginService(userId, password)
  res.json(data)
}

// POST /api/auth/logout
const logout = async (req, res) => {
  // JWT는 서버에서 무효화 불가 → 클라이언트에서 토큰 삭제
  // 필요 시 토큰 블랙리스트 구현 가능
  res.json({ message: '로그아웃 되었습니다.' })
}

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await getMeService(req.user.userId)
  if (!user) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }
  res.json(user)
}

module.exports = { login, logout, getMe }
