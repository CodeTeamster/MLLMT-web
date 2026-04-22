/**
 * inferenceRecords.js
 * Persists inference run results in localStorage so they can be shared
 * across the "多模态大模型推理", "推理排行榜", and "推理任务记录" pages.
 */

const STORAGE_KEY = 'mllmt_inference_records'
const MAX_RECORDS = 200

/**
 * Format a Date object to "yyyy-MM-dd HH:mm:ss"
 */
export function formatNow() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Format any timestamp string or Date to "yyyy-MM-dd HH:mm:ss"
 */
export function formatTimestamp(ts) {
  if (!ts) return '--'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return String(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Load all records from localStorage
 * @returns {Array}
 */
function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save all records to localStorage
 * @param {Array} records
 */
function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)))
  } catch {
    // ignore storage errors
  }
}

/**
 * Add a new inference record.
 * Called after an inference run completes in the multimodal inference page.
 *
 * @param {Object} record
 * @param {string} record.modelName     - Display name of the model
 * @param {string} record.modelValue    - Value/identifier of the model
 * @param {string} record.testCase      - Test case label (e.g. "动物识别")
 * @param {string} record.testCaseValue - Test case value (e.g. "animal-recognition")
 * @param {string} record.algorithmName - Algorithm display name
 * @param {string} record.algorithmValue - Algorithm value
 * @param {number|string} record.throughput  - tokens/s
 * @param {number|string} record.latency     - ms (average per token latency in seconds, stored as-is)
 * @param {number|string} record.gpuMemory   - GB
 * @param {string} [record.operatorName]     - Who ran it
 */
export function addInferenceRecord(record) {
  const records = loadRecords()
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const executionTime = formatNow()
  const newRecord = {
    id,
    executionTime,
    modelName: record.modelName || '--',
    modelValue: record.modelValue || '',
    testCase: record.testCase || '--',
    testCaseValue: record.testCaseValue || '',
    algorithmName: record.algorithmName || '--',
    algorithmValue: record.algorithmValue || '',
    throughput: record.throughput !== undefined ? record.throughput : '--',
    latency: record.latency !== undefined ? record.latency : '--',
    gpuMemory: record.gpuMemory !== undefined ? record.gpuMemory : '--',
    operatorName: record.operatorName || '--'
  }
  // prepend (newest first)
  records.unshift(newRecord)
  saveRecords(records)
  return newRecord
}

/**
 * Get all records for the rank page (sorted by a metric).
 * gpuMemory: ascending (lower is better)
 * throughput / latency: descending (higher is better)
 * @param {string} [metric='throughput'] - 'throughput' | 'latency' | 'gpuMemory'
 */
export function getRankRecords(metric = 'throughput') {
  const records = loadRecords()
  const sorted = [...records].sort((a, b) => {
    const av = Number(a[metric])
    const bv = Number(b[metric])
    if (!isFinite(av) && !isFinite(bv)) return 0
    if (!isFinite(av)) return 1
    if (!isFinite(bv)) return -1
    // gpuMemory: ascending (lower usage is better)
    if (metric === 'gpuMemory') return av - bv
    // throughput & latency: descending
    return bv - av
  })
  return sorted.map((rec, idx) => ({
    rank: idx + 1,
    id: rec.id,
    modelName: rec.modelName,
    modelValue: rec.modelValue,
    algorithmName: rec.algorithmName,
    algorithmValue: rec.algorithmValue,
    throughput: isFinite(Number(rec.throughput)) ? Number(rec.throughput).toFixed(2) : '--',
    // latency stored in seconds, display in milliseconds
    latency: isFinite(Number(rec.latency)) ? (Number(rec.latency) * 1000).toFixed(2) : '--',
    gpuMemory: isFinite(Number(rec.gpuMemory)) ? Number(rec.gpuMemory).toFixed(2) : '--',
    executionTime: rec.executionTime,
    operatorName: rec.operatorName,
    testCase: rec.testCase,
    testCaseValue: rec.testCaseValue
  }))
}

/**
 * Get history records (grouped by model + test case run session).
 * Each unique inference session (same id) is one history entry.
 */
export function getHistoryRecords() {
  const records = loadRecords()
  // Each record is already one "run", return them directly
  return records.map((rec) => ({
    id: rec.id,
    taskHash: rec.id.slice(-8),
    modelName: rec.modelName,
    modelValue: rec.modelValue,
    testCase: rec.testCase,
    testCaseValue: rec.testCaseValue,
    algorithms: [rec.algorithmName],
    algorithmValue: rec.algorithmValue,
    executionTime: rec.executionTime,
    operatorName: rec.operatorName
  }))
}

/**
 * Delete a record by id
 * @param {string} id
 */
export function deleteInferenceRecord(id) {
  const records = loadRecords()
  const filtered = records.filter((r) => r.id !== id)
  saveRecords(filtered)
}
