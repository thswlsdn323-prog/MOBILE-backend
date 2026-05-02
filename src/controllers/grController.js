const { grSearchService } = require('../services/grService')

/**
 * GET /GR/GrSearch
 * 입고 이력 조회
 *
 * Query Params:
 *   fromDate  - 조회 시작일 (YYYY-MM-DD)
 *   toDate    - 조회 종료일 (YYYY-MM-DD)
 *   itemCode  - 품번
 *   itemName  - 품명
 *   spec      - 규격
 */
const grSearch = async (req, res) => {
  const { fromDate, toDate, itemCode, itemName, spec } = req.query

  if (!fromDate || !toDate) {
    return res.status(400).json({ message: '조회 시작일과 종료일을 입력해주세요.' })
  }

  const data = await grSearchService(fromDate, toDate, itemCode, itemName, spec)
  res.json(data)
}

module.exports = { grSearch }
