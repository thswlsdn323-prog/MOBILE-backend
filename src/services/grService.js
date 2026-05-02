const { getPool, sql } = require('../config/db')

/**
 * GR 입고 이력 조회
 * SP: USP_GR_SEARCH
 *
 * @param {string} fromDate  - 조회 시작일 (YYYY-MM-DD)
 * @param {string} toDate    - 조회 종료일 (YYYY-MM-DD)
 * @param {string} itemCode  - 품번 (부분 검색)
 * @param {string} itemName  - 품명 (부분 검색)
 * @param {string} spec      - 규격 (부분 검색)
 * @returns {Array}          - 입고 이력 목록
 */
const grSearchService = async (fromDate, toDate, itemCode, itemName, spec) => {
  const pool = getPool()

  const result = await pool.request()
    // .input('FROM_DATE', sql.NVarChar(10), fromDate  || '')
    // .input('TO_DATE',   sql.NVarChar(10), toDate    || '')
    // .input('ITEM_CD',   sql.NVarChar(50), itemCode  || '')
    // .input('ITEM_NM',   sql.NVarChar(100), itemName || '')
    // .input('SPEC',      sql.NVarChar(100), spec     || '')
    // .execute('USP_GR_SEARCH')
    // return result.recordset
    return {data:[{"recvNo":"RV001", "recvDate":"20260502", "itemName":"AAA", "itemCode":"A001", "spec":"SPEC01", "qty":"1000", "unit":"EA",  "status":"C"},
                  {"recvNo":"RV002", "recvDate":"20260502", "itemName":"BBB", "itemCode":"B001", "spec":"SPEC02", "qty":"1500", "unit":"SET", "status":"P"}]}
  
}

module.exports = { grSearchService }
