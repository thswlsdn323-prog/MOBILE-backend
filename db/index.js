/**
 * db/index.js
 * MSSQL 연결 풀 싱글톤
 */

const sql = require('mssql')

const config = {
  server:   process.env.DB_SERVER   || 'localhost',
  port:     parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'MES_DB',
  user:     process.env.DB_USER     || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt:               process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool = null

/**
 * 연결 풀 반환 (없으면 새로 생성)
 * @returns {Promise<sql.ConnectionPool>}
 */
const getPool = async () => {
  if (pool && pool.connected) return pool
  pool = await new sql.ConnectionPool(config).connect()
  console.log('[DB] MSSQL 연결 풀 생성 완료')
  return pool
}

module.exports = { getPool, sql }
