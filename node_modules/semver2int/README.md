# semver2int
> convert a semver string to an integer for simple comparisons

## Description
Accepts a semver string and returns an integer representation.

Each section of the semver (X, Y, Z) is padded to two digits. This ensures that values like `0.1.0` returns a number greater than `0.0.11`.
The above examples will yield *100* and *11* respectively.

```js
var semver2int = require('semver2int');
semver2int('0.0.11') // 11
semver2int('0.1.0') // 100
semver2int('v1.2.3') // 10203
semver2int('2.1.12') // 20112
semver2int('1.0.0-beta+12345') // 10000
semver2int('1.0') // -1
semver2int(1.234) // -1
```

**NOTE: all prerelease information and metadata from a semver string is ignored.**

This is obviously a gross simplification of a semver string, but sometimes you just want a number for simple comparisons. 
 
## Limitations
The resulting integer will be between 0 and 999999. A return value of *-1* implies:

- an invalid semver string (such as 1.0).
- the major, minor, or patch number is greater than 99. (such as 1.1.100).
- the passed argument is not a string.
