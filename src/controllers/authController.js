const { loginService, refreshService, logoutService, getMeService } = require('../services/authService')

// POST /api/auth/login
const login = async (req, res) => {
  const { userId, password, COMP, FACT } = req.body

  if (!userId || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' })
  }
  if (!COMP || !FACT) {
    return res.status(400).json({ message: '회사코드와 사업장코드를 선택해주세요.' })
  }

  const data = await loginService(userId, password, COMP, FACT)
  res.json(data)
}

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ message: '리프레시 토큰이 없습니다.' })
  }

  const data = refreshService(refreshToken)
  res.json(data)
}

// POST /api/auth/logout
const logout = async (req, res) => {
  const { refreshToken } = req.body
  logoutService(refreshToken)
  res.json({ message: '로그아웃 되었습니다.' })
}

// GET /api/auth/me
const getMe = async (req, res) => {
  if (process.env.DEV_MOCK_LOGIN === 'true') {
    return res.json(req.user)
  }

  const user = await getMeService(req.user.userId)
  if (!user) {
    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
  }
  res.json(user)
}

module.exports = { login, refresh, logout, getMe }
