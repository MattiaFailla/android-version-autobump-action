/**
 * Converts a Semantic Version string into a number that can be easily compared.
 *
 * Each part of the semver (X.Y.Z) is padded to a 2 digit number.
 * For example, `1` will become `01` in the result. This ensures that
 * version `0.1.0` is greater than `0.0.11`. This also makes the assumption
 * that no single point value is greater than 99. Also note, a padded zero
 * on X is lost during the conversion to a number.
 *
 * `-1` is returned for invalid semvers or where X, Y, or Z is greater than 99.
 *
 * @see http://semver.org/
 *
 * @param {String} semver - a semver string
 * @return {Number} 
 */
var semver2int = function (semver) {
  var parts, mmp;

  /** 
   * Pluck X.Y.Z semver (up to 2 digits each) from a string.
   * @see http://regexr.com/3aolp
   */
  parts = /^v?(\d{1,2}\.\d{1,2}\.\d{1,2})(?!\d|\.)/i.exec(semver);

  // check for invalid semver
  if (!parts || !parts[1]) { return -1; }

  // split into Major Minor an Patch parts
  parts = parts[1].split('.');

  // pad each part of MAJOR, MINOR, PATCH to 2 digits
  // this assumes no single part is greater than 99...
  mmp = parts.map(function(item) {
    return (+item < 10) ? '0' + item : item;
  });

  // remove the point separators
  mmp = mmp.join('').replace(/\./g, '');

  // coerce to Number
  return +mmp;
}

// export
module.exports = semver2int;
