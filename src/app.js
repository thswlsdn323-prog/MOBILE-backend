require('dotenv').config()
require('express-async-errors')

const express = require('express')
const cors = require('cors')
const { connectDB } = require('./config/db')
const errorHandler = require('./middlewares/errorHandler')

// 라우터
const authRouter = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 3000

// ─── 미들웨어 ───────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── 라우터 등록 ────────────────────────────────────
app.use('/api/auth', authRouter)

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ─── 에러 핸들러 (라우터 아래에 위치해야 함) ──────────
app.use(errorHandler)

// ─── 서버 시작 ──────────────────────────────────────
const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`🚀 MES 백엔드 서버 실행 중: http://localhost:${PORT}`)
    console.log(`📋 환경: ${process.env.NODE_ENV}`)
  })
}

start()
