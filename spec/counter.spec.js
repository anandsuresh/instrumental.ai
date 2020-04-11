/**
 * @file Behavioral specification for the event counter
 */
'use strict'

const { expect } = require('chai')
const Counter = require('../lib/counter')

describe('EventCounter', function () {
  let counter = null

  describe('instantiation', function () {
    it('must create an instance with the default maxDuration', function () {
      expect(function () { counter = Counter.create() }).to.not.throw()
      expect(counter).to.be.an.instanceof(Counter)
      expect(counter.maxDuration).to.equal(60)
      expect(counter.data).to.be.an('uint32array')
      expect(counter.data).to.have.lengthOf(60)
      expect(counter.lastUpdatedAt).to.be.a('number')
    })

    it('must create an instance with a user-defined maxDuration', function () {
      let counter = null

      expect(function () { counter = Counter.create(10) }).to.not.throw()
      expect(counter).to.be.an.instanceof(Counter)
      expect(counter.maxDuration).to.equal(10)
      expect(counter.data).to.be.an('uint32array')
      expect(counter.data).to.have.lengthOf(10)
      expect(counter.lastUpdatedAt).to.be.a('number')
    })
  })

  describe('operation', function () {
    beforeEach(function () {
      counter = Counter.create(4)
    })

    it('must prevent addition of properties to the instance', function () {
      expect(() => { counter.prop = 42 }).to.throw(/object is not extensible$/)
    })

    describe('#increment()', function () {
      it('must return false when incrementing causes an overflow', function () {
        // mock out old data
        const maxInt = (2 ** 32) - 1
        for (let i = 0; i < counter.maxDuration; i++) {
          counter.data[i] = maxInt
        }

        expect(counter.increment()).to.equal(false)
      })

      it('must not increment count when it causes an overflow', function () {
        // mock out old data
        const maxInt = (2 ** 32) - 1
        for (let i = 0; i < counter.maxDuration; i++) {
          counter.data[i] = maxInt
        }

        counter.increment()

        for (let i = 0; i < counter.maxDuration; i++) {
          expect(counter.data[i]).to.equal(maxInt)
        }
      })

      it('must return true when incrementing without an overflow', function () {
        expect(counter.increment()).to.equal(true)
      })

      it('must correctly increment the counter', function () {
        // This test may fail if the increment operation and test check straddle
        // the time-unit boundary. Automatically retry once to avoid a false
        // failure.
        this.retries(1)

        counter.increment()
        const index = Counter.now() % counter.maxDuration
        expect(counter.data[index]).to.equal(1)
      })

      describe('must record counts correctly over time', function () {
        it('must reset a prior entry to 0 before reuse', function (done) {
          // increment every second until at least one prior location is reused
          let iterations = 0

          const timer = setInterval(function () {
            if (iterations++ <= counter.maxDuration) {
              expect(counter.increment()).to.equal(true)
              return
            }

            clearInterval(timer)
            counter.data.forEach(count => expect(count).to.equal(1))
            done()
          }, 1000)
        })

        it('must reset "holes" to zero correctly', function (done) {
          // increment every other second to cause "holes" in the count data
          // Note that this test is dependent on the `maxDuration` being an even
          // number!
          let iterations = 0

          const timer = setInterval(function () {
            if (iterations++ < counter.maxDuration) {
              expect(counter.increment()).to.equal(true)
              return
            }

            clearInterval(timer)
            for (let j = counter.data[0], i = 1; i < counter.data.length; i++) {
              expect(counter.data[i]).to.equal((i + j) % 2)
            }
            done()
          }, 2000)
        })

        it('must reset counts after maxDuration seconds of inactivity', function (done) {
          const { data, maxDuration } = counter

          // mock out old data
          for (let i = 0; i < maxDuration; i++) {
            data[i] = 1
          }

          // wait for maxDuration
          setTimeout(function () {
            counter.increment()

            const filter = x => i => i === x
            expect(data.filter(filter(1))).to.have.lengthOf(1)
            expect(data.filter(filter(0))).to.have.lengthOf(maxDuration - 1)

            done()
          }, maxDuration * 1000)
        })
      })
    })

    describe('#getCount()', function () {
      it('must return the count over maxDuration, by default', function (done) {
        // increment every second until at least one prior location is reused
        let iterations = 0

        const timer = setInterval(function () {
          if (iterations++ < counter.maxDuration) {
            expect(counter.increment()).to.equal(true)
            return
          }

          expect(counter.increment()).to.equal(true)
          expect(counter.getCount()).to.equal(counter.maxDuration)

          clearInterval(timer)
          done()
        }, 1000)
      })

      it('must return the count for the specified duration', function (done) {
        // increment every second until at least one prior location is reused
        let iterations = 0

        const timer = setInterval(function () {
          if (iterations++ < counter.maxDuration) {
            expect(counter.increment()).to.equal(true)
            return
          }

          expect(counter.increment()).to.equal(true)
          expect(counter.getCount(3)).to.equal(3)

          clearInterval(timer)
          done()
        }, 1000)
      })

      it('must reset the duration to maxDuration if it is greater', function (done) {
        // increment every second until at least one prior location is reused
        let iterations = 0

        const timer = setInterval(function () {
          if (iterations++ < counter.maxDuration) {
            expect(counter.increment()).to.equal(true)
            return
          }

          expect(counter.increment()).to.equal(true)
          expect(counter.getCount(100)).to.equal(counter.getCount())

          clearInterval(timer)
          done()
        }, 1000)
      })

      it('must reset the duration to 1 if it is lesser', function (done) {
        // increment every second until at least one prior location is reused
        let iterations = 0

        const timer = setInterval(function () {
          if (iterations++ < counter.maxDuration) {
            expect(counter.increment()).to.equal(true)
            return
          }

          expect(counter.increment()).to.equal(true)
          expect(counter.getCount(0)).to.equal(counter.getCount(1))

          clearInterval(timer)
          done()
        }, 1000)
      })
    })
  })
})
