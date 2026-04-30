const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}`, err.message)

  // MSSQL 에러
  if (err.code === 'ELOGIN') {
    return res.status(500).json({ message: 'DB 로그인 실패' })
  }
  if (err.code === 'ETIMEOUT') {
    return res.status(500).json({ message: 'DB 연결 시간 초과' })
  }

  // 일반 에러
  const status = err.status || 500
  const message = err.message || '서버 오류가 발생했습니다.'

  res.status(status).json({ message })
}

module.exports = errorHandler
