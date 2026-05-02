const express = require('express')
const router = express.Router()
const { grSearch } = require('../controllers/grController')
const authMiddleware = require('../middlewares/auth')

// GET /GR/GrSearch - 입고 이력 조회 (인증 필요)
router.get('/GrSearch', authMiddleware, grSearch)

module.exports = router
