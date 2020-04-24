'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dateTimeForTimeZone = exports.dateTime = exports.toDuration = exports.toUtc = exports.isDateTime = exports.getLocaleData = exports.setLocale = exports.ISO_8601 = undefined;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ISO_8601 = exports.ISO_8601 = _moment2.default.ISO_8601;

var setLocale = exports.setLocale = function setLocale(language) {
  _moment2.default.locale(language);
};

var getLocaleData = exports.getLocaleData = function getLocaleData() {
  return _moment2.default.localeData();
};

var isDateTime = exports.isDateTime = function isDateTime(value) {
  return _moment2.default.isMoment(value);
};

var toUtc = exports.toUtc = function toUtc(input, formatInput) {
  return _moment2.default.utc(input, formatInput);
};

var toDuration = exports.toDuration = function toDuration(input, unit) {
  return _moment2.default.duration(input, unit);
};

var dateTime = exports.dateTime = function dateTime(input, formatInput) {
  return (0, _moment2.default)(input, formatInput);
};

var dateTimeForTimeZone = exports.dateTimeForTimeZone = function dateTimeForTimeZone(timezone, input, formatInput) {
  if (timezone === 'utc') {
    return toUtc(input, formatInput);
  }

  return dateTime(input, formatInput);
};
//# sourceMappingURL=moment_wrapper.js.map
