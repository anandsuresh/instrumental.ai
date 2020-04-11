/**
 * @file An event counter library
 */
'use strict'

/**
 * Export the interface
 * @type {Object}
 */
module.exports = class Counter {
  /**
   * Constructs a new instance of a counter
   *
   * Counter data is stored in a circular buffer to guarantee bounded memory
   * usage. As time progresses, older counter data is overwritten with new data.
   * The `_getIndex()` method of this class carefully handles resetting counter
   * data to zero, including cases where the caller may not be recording data
   * continuously.
   *
   * The class uses a `Uint32Array`, which is backed by a contiguous block of
   * memory, as opposed to an `Array`, which is a list-like structure. This has
   * an interesting side-effect. The maximum count for a single second cannot
   * exceed 4,294,967,295. However, JavaScript integers can go as high as
   * 9,007,199,254,740,991 (Number.MAX_SAFE_INTEGER). Consequently the
   * `.increment()` method overflows differently than the `.getCount()` method.
   *
   * @param {Number} [maxDuration=60] Max. duration (in seconds) to store
   * event counts for subsequent querying
   */
  constructor (maxDuration = 60) {
    Object.seal(Object.assign(this, {
      maxDuration,
      data: new Uint32Array(maxDuration).fill(0),
      lastUpdatedAt: Counter.now()
    }))
  }

  /**
   * Retrieves the index for the next read/write in the data array
   *
   * This method also handles resetting previously used locations in the
   * circular buffer to zero before reusing the values for new data. This also
   * has the added side-effect of only reading the latest timestamp value once
   * in this function, thereby avoiding situations wherein multiple reads of the
   * timestamp across different functions during a single `.increment()` or
   * `.getCount()` may cause the operation to straddle a time-unit boundary
   * between resetting a prior value and reading/writing the latest count.
   *
   * @returns {Number} The index of the next write
   */
  _getIndex () {
    const { maxDuration, data, lastUpdatedAt } = this
    const now = Counter.now()
    const index = now % maxDuration
    const elapsed = now - lastUpdatedAt

    if (elapsed === 1) {
      data[index] = 0
    } else if (elapsed >= maxDuration) {
      data.fill(0)
    } else if (elapsed > 1) {
      const start = (lastUpdatedAt + 1) % maxDuration
      const end = (now + 1) % maxDuration

      if (start < end) {
        data.fill(0, start, end)
      } else {
        data.fill(0, start, maxDuration)
        data.fill(0, 0, end)
      }
    }

    this.lastUpdatedAt = now
    return index
  }

  /**
   * Increments the value of the counter
   *
   * In the event of an overflow, the count remains pegged at the maximum value
   * permitted for a 32-bit unsigned integer.
   *
   * @returns {Boolean} true, if the increment was successful; false on overflow
   */
  increment () {
    const index = this._getIndex()
    const lastCount = this.data[index]
    ++this.data[index]

    if (this.data[index] === 0) {
      this.data[index] = lastCount
      return false
    }

    return true
  }

  /**
   * Returns the count of event occurances over the specified duration
   *
   * This method checks to see if the final count reaches the maximum integer
   * represented correctly by JavaScript. If so, then the method returns -1. In
   * practice, this would be highly improbable condition, but the method checks
   * for it, nevertheless.
   *
   * @param {Number} [duration] The duration (in seconds) since the current time
   * @returns {Number} The count of the event occurances over the duration; -1
   * when the count overflows
   */
  getCount (duration) {
    const index = this._getIndex()
    const { data, maxDuration } = this
    let count = 0

    duration = isNaN(duration)
      ? maxDuration
      : (duration > maxDuration)
        ? maxDuration
        : duration < 1
          ? 1
          : duration

    for (let i = duration - 1; i >= 0; i--) {
      const idx = index - i < 0 ? index - i + maxDuration : index - i
      count += data[idx]
    }

    /* istanbul ignore else */
    if (count <= Number.MAX_SAFE_INTEGER) {
      return count
    } else {
      return -1
    }
  }

  /**
   * Returns the current timestamp in seconds
   * @returns {Number}
   */
  static now () {
    return Math.floor(Date.now() / 1000)
  }

  /**
   * Functional helper to create a new instance of a Counter
   * @param {Number} [maxDuration] Maximum duration, in seconds, for which the
   * counter maintains historical data
   * @returns {Counter}
   */
  static create (maxDuration) {
    return new Counter(maxDuration)
  }
}
