const sql = require('mssql')

const dbConfig = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,           // 로컬 환경 false, Azure는 true
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,                  // 최대 커넥션 수
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool = null

// DB 연결 풀 생성
const connectDB = async () => {
  try {
    pool = await sql.connect(dbConfig)
    console.log('✅ MSSQL 연결 성공:', process.env.DB_NAME)
    return pool
  } catch (err) {
    console.error('❌ MSSQL 연결 실패:', err.message)
    process.exit(1)
  }
}

// 쿼리 실행 헬퍼
const getPool = () => {
  if (!pool) throw new Error('DB가 연결되지 않았습니다.')
  return pool
}

module.exports = { connectDB, getPool, sql }
