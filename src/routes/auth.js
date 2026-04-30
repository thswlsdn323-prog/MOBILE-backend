const express = require('express')
const router = express.Router()
const { login, logout, getMe } = require('../controllers/authController')
const authMiddleware = require('../middlewares/auth')

// 로그인 (인증 불필요)
router.post('/login', login)

// 로그아웃 (인증 필요)
router.post('/logout', authMiddleware, logout)

// 내 정보 (인증 필요)
router.get('/me', authMiddleware, getMe)

module.exports = router
