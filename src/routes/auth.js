const express = require('express')
const router = express.Router()
const { login, refresh, logout, getMe } = require('../controllers/authController')
const authMiddleware = require('../middlewares/auth')

router.post('/login',   login)
router.post('/refresh', refresh)
router.post('/logout',  logout)
router.get('/me',       authMiddleware, getMe)

module.exports = router
