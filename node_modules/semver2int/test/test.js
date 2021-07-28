var assert = require("assert");
var semver2int = require('../index');

describe('semver2int', function() {
  it('should convert the patch number properly', function() {
    assert.equal(0, semver2int('0.0.0'));
    assert.equal(1, semver2int('0.0.1'));
    assert.equal(10, semver2int('0.0.10'));
    assert.equal(11, semver2int('0.0.11'));
    assert.equal(99, semver2int('0.0.99'));
  });

  it('should convert the minor number properly', function() {
    assert.equal(100, semver2int('0.1.0'));
    assert.equal(1000, semver2int('0.10.0'));
    assert.equal(1100, semver2int('0.11.0'));
    assert.equal(9900, semver2int('0.99.0'));
  });

  it('should convert the major number properly', function() {
    assert.equal(10000, semver2int('1.0.0'));
    assert.equal(100000, semver2int('10.0.0'));
    assert.equal(110000, semver2int('11.0.0'));
    assert.equal(990000, semver2int('99.0.0'));
  });

  it('should pad each part (major, minor, patch) to two digits', function() {
    assert.equal(202, semver2int('0.2.2'));
    assert.equal(20202, semver2int('2.2.2'));
    assert.equal(121212, semver2int('12.12.12'));
  });

  it('should ignore a leading "v" in version string', function() {
    assert.equal(1, semver2int('v0.0.1'));
    assert.equal(10001, semver2int('v1.0.1'));
  });

  it('should ignore any prerelease version data', function() {
    assert.equal(1, semver2int('0.0.1-beta.1'));
    assert.equal(1, semver2int('0.0.1-alpha.1'));
    assert.equal(1, semver2int('0.0.1-rc.1'));
  });

  it('should ignore any version metadata', function() {
    assert.equal(1, semver2int('0.0.1+20130313144700'));
    assert.equal(1, semver2int('0.0.1+exp.sha.5114f85'));
    assert.equal(10000, semver2int('1.0.0-alpha+001'));
  });

  it('should work with version parts up to 99', function() {
    assert.equal(99, semver2int('0.0.99'));
    assert.equal(9900, semver2int('0.99.0'));
    assert.equal(990000, semver2int('99.0.0'));
    assert.equal(999999, semver2int('99.99.99'));
  });

  it('should return -1 if any part is greater than 99', function() {
    assert.equal(-1, semver2int('0.0.100'));
    assert.equal(-1, semver2int('0.100.0'));
    assert.equal(-1, semver2int('100.10.10'));
    assert.equal(-1, semver2int('100.100.100'));
  });

  it('should return -1 for invalid semver strings', function() {
    assert.equal(-1, semver2int('0.1'));
    assert.equal(-1, semver2int('1.0'));
    assert.equal(-1, semver2int('1.0-beta'));
    assert.equal(-1, semver2int('1.0+789'));
    assert.equal(-1, semver2int('1.0.1.1'));
    assert.equal(-1, semver2int('not semver'));
  });

  it('should return -1 if the argument is not a string', function() {
    assert.equal(-1, semver2int(1.23));
    assert.equal(-1, semver2int({}));
    assert.equal(-1, semver2int([]));
    assert.equal(-1, semver2int(function() {}));
    assert.equal(-1, semver2int());
  });
});
