import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseFlex } from '../api/book-refresh.js'

const SAMPLE = `<FlexQueryResponse queryName="book" type="AF">
<FlexStatements count="1">
<FlexStatement accountId="U1234567" fromDate="2026-07-30" toDate="2026-07-30">
<EquitySummaryInBase>
<EquitySummaryByReportDateInBase reportDate="2026-07-30" total="9593209.6" cash="5295222.71"/>
</EquitySummaryInBase>
<OpenPositions>
<OpenPosition assetCategory="STK" symbol="UNH" description="UNITEDHEALTH GROUP INC" position="15834" markPrice="418.63" costBasisPrice="294.204548" levelOfDetail="SUMMARY"/>
<OpenPosition assetCategory="STK" symbol="AAPL" description="APPLE INC" position="-1500" markPrice="331.92" costBasisPrice="160.7906" levelOfDetail="SUMMARY"/>
<OpenPosition assetCategory="STK" symbol="AAPL" description="APPLE INC" position="-500" markPrice="331.92" costBasisPrice="150" levelOfDetail="LOT"/>
<OpenPosition assetCategory="OPT" symbol="SPY 260918C00500000" position="10" markPrice="12.5" costBasisPrice="10"/>
<OpenPosition assetCategory="STK" symbol="ZERO" position="0" markPrice="10" costBasisPrice="10"/>
</OpenPositions>
</FlexStatement>
</FlexStatements>
</FlexQueryResponse>`

test('parseFlex maps summary stock rows, skips lots/options/flat', () => {
  const { rows, netLiq } = parseFlex(SAMPLE)
  assert.equal(rows.length, 2)
  const unh = rows.find((r) => r.sym === 'UNH')
  assert.equal(unh.qty, 15834)
  assert.equal(unh.last, 418.63)
  assert.equal(unh.prevClose, 418.63)
  assert.equal(unh.yh, 'UNH')
  assert.ok(unh.name.startsWith('UNITEDHEALTH'))
  const aapl = rows.find((r) => r.sym === 'AAPL')
  assert.equal(aapl.qty, -1500, 'LOT row must not double-count')
  assert.equal(netLiq, 9593209.6)
})

test('parseFlex nets duplicate summary rows for one symbol', () => {
  const xml = `<FlexQueryResponse><OpenPositions>
<OpenPosition assetCategory="STK" symbol="MDT" position="10000" markPrice="85" costBasisPrice="80"/>
<OpenPosition assetCategory="STK" symbol="MDT" position="3000" markPrice="85" costBasisPrice="70"/>
</OpenPositions></FlexQueryResponse>`
  const { rows } = parseFlex(xml)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].qty, 13000)
  assert.ok(Math.abs(rows[0].avg - (80 * 10000 + 70 * 3000) / 13000) < 1e-9)
})

test('parseFlex tolerates junk', () => {
  assert.deepEqual(parseFlex('<xml>nothing here</xml>').rows, [])
  assert.equal(parseFlex('').netLiq, null)
})
