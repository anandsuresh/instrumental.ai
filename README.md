# Event-Counter

An event-counter that tracks counts over a fixed time-period.

## Installation

``` bash
$ npm install --save smart-counter
```

## Usage

Start by including the library.

```javascript
const Counter = require('smart-counter')
```

Create a new counter instance, specifying the maximum duration over which counts
are tracked. By default, this would be 1 minute.

```javascript
const counter = Counter.create(5 * 60) // 5 minute time-period
```

To increment the counter, call the `.increment()` method. Ensure to track the
return value of this method. For a successful increment, this method will
return `true`. If however, the increment results in an overflow, then the method
return `false`.

```javascript
if (!counter.increment()) {
  console.warn('counter overflowed!')
}
```

Finally, to retrieve the count over some period of time, call the `.getCount()`
method. If no time-period is specified, the method defaults to the maximum
duration of the counter instance. If the count overflows, then the method should
return `-1`.

```javascript
const count = counter.getCount(60) // retrieves count over the last minute
if (count === -1) console.warn('count overflowed!')
```

## Testing and code coverage

Test cases can be run using `npm test`. This causes the linter to be kicked up
before running the tests.

```
$ npm test


  EventCounter
    instantiation
      ✓ must create an instance with the default maxDuration
      ✓ must create an instance with a user-defined maxDuration
    operation
      ✓ must prevent addition of properties to the instance
      #increment()
        ✓ must return false when incrementing causes an overflow
        ✓ must not increment count when it causes an overflow
        ✓ must return true when incrementing without an overflow
        ✓ must correctly increment the counter
        must record counts correctly over time
          ✓ must reset a prior entry to 0 before reuse (6022ms)
          ✓ must reset "holes" to zero correctly (10029ms)
          ✓ must reset counts after maxDuration seconds of inactivity (4010ms)
      #getCount()
        ✓ must return the count over maxDuration, by default (5011ms)
        ✓ must return the count for the specified duration (5021ms)
        ✓ must reset the duration to maxDuration if it is greater (5011ms)
        ✓ must reset the duration to 1 if it is lesser (5013ms)


  14 passing (40s)
```

Alternately, to check for code-coverage, one can run `npm run coverage`. This
should generate code-coverage reports and save them to the `coverage` directory.
To view the coverage report on a mac, one can run `open coverage/index.html`.
This should open the code-coverage report in the browser.

```
$ npm run coverage


  EventCounter
    instantiation
      ✓ must create an instance with the default maxDuration
      ✓ must create an instance with a user-defined maxDuration
    operation
      ✓ must prevent addition of properties to the instance
      #increment()
        ✓ must return false when incrementing causes an overflow
        ✓ must not increment count when it causes an overflow
        ✓ must return true when incrementing without an overflow
        ✓ must correctly increment the counter
        must record counts correctly over time
          ✓ must reset a prior entry to 0 before reuse (6022ms)
          ✓ must reset "holes" to zero correctly (10029ms)
          ✓ must reset counts after maxDuration seconds of inactivity (4010ms)
      #getCount()
        ✓ must return the count over maxDuration, by default (5011ms)
        ✓ must return the count for the specified duration (5021ms)
        ✓ must reset the duration to maxDuration if it is greater (5011ms)
        ✓ must reset the duration to 1 if it is lesser (5013ms)


  14 passing (40s)


=============================== Coverage summary ===============================
Statements   : 100% ( 38/38 )
Branches     : 100% ( 20/20 )
Functions    : 100% ( 6/6 )
Lines        : 100% ( 37/37 )
================================================================================
```
