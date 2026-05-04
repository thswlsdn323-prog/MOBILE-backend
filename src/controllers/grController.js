const { grSearchService } = require('../services/grService')

/**
 * GET /GR/GrSearch
 * 입고 이력 조회
 *
 * Query Params:
 *    COMP      - 회사코드
 *    FACT      - 사업장코드
 *    SDATE     - 조회 시작일 (YYYYMMDD)
 *    EDATE     - 조회 종료일 (YYYYMMDD)
 *    ITEM_CD   - 품번
 *    ITEM_NM   - 품명
 *    ITEM_DC   - 규격
 */
const grSearch = async (req, res) => {
  const { COMP, FACT, SDATE, EDATE, ITEM_CD, ITEM_NM, ITEM_DC } = req.query

  if (!SDATE || !EDATE) {
    return res.status(400).json({ message: '조회 시작일과 종료일을 입력해주세요.' })
  }

  const data = await grSearchService(COMP, FACT, SDATE, EDATE, ITEM_CD, ITEM_NM, ITEM_DC)
  res.json(data)
}

module.exports = { grSearch }
