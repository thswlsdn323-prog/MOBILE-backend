const { getPool, sql } = require('../config/db')

/**
 * GR 입고 이력 조회
 * SP: USP_GR_SEARCH
 * @param {string} COMP     - 회사코드
 * @param {string} FACT     - 사업장코드
 * @param {string} SDATE    - 조회 시작일 (YYYYMMDD)
 * @param {string} EDATE    - 조회 종료일 (YYYYMMDD)
 * @param {string} ITEM_CD  - 품번 (부분 검색)
 * @param {string} ITEM_NM  - 품명 (부분 검색)
 * @param {string} ITEM_DC  - 규격 (부분 검색)
 * @returns {Array}         - 입고 이력 목록
 */
const grSearchService = async (COMP, FACT, SDATE, EDATE, ITEM_CD, ITEM_NM, ITEM_DC) => {
  const pool = getPool()

  const result = await pool.request()
    .input('COMP',      sql.NVarChar(4),    COMP      || '1000')
    .input('FACT',      sql.NVarChar(4),    FACT      || '1000')
    .input('SDATE',     sql.NVarChar(8),    SDATE     || '')
    .input('EDATE',     sql.NVarChar(8),    EDATE     || '')
    .input('ITEM_CD',   sql.NVarChar(30),   ITEM_CD   || '')
    .input('ITEM_NM',   sql.NVarChar(50),   ITEM_NM   || '')
    .input('ITEM_DC',   sql.NVarChar(60),   ITEM_DC   || '')
    .execute('USP_MOBILE_GR_SEARCH')
    return result.recordset
    // return {data:[{"recvNo":"RV001", "recvDate":"20260502", "itemName":"AAA", "itemCode":"A001", "spec":"SPEC01", "qty":"1000", "unit":"EA",  "status":"C"},
    //               {"recvNo":"RV002", "recvDate":"20260502", "itemName":"BBB", "itemCode":"B001", "spec":"SPEC02", "qty":"1500", "unit":"SET", "status":"P"}]}
  
}

module.exports = { grSearchService }
