'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isMathString = isMathString;
exports.parse = parse;
exports.isValid = isValid;
exports.parseDateMath = parseDateMath;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment_wrapper = require('./moment_wrapper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var units = ['y', 'M', 'w', 'd', 'h', 'm', 's'];

function isMathString(text) {
  if (!text) {
    return false;
  }

  if (typeof text === 'string' && (text.substring(0, 3) === 'now' || text.includes('||'))) {
    return true;
  } else {
    return false;
  }
}

/**
 * Parses different types input to a moment instance. There is a specific formatting language that can be used
 * if text arg is string. See unit tests for examples.
 * @param text
 * @param roundUp See parseDateMath function.
 * @param timezone Only string 'utc' is acceptable here, for anything else, local timezone is used.
 */
function parse(text, roundUp, timezone) {
  if (!text) {
    return undefined;
  }

  if (typeof text !== 'string') {
    if ((0, _moment_wrapper.isDateTime)(text)) {
      return text;
    }
    if (_lodash2.default.isDate(text)) {
      return (0, _moment_wrapper.dateTime)(text);
    }
    // We got some non string which is not a moment nor Date. TS should be able to check for that but not always.
    return undefined;
  } else {
    var time = void 0;
    var mathString = '';
    var index = void 0;
    var parseString = void 0;

    if (text.substring(0, 3) === 'now') {
      time = (0, _moment_wrapper.dateTimeForTimeZone)(timezone);
      mathString = text.substring('now'.length);
    } else {
      index = text.indexOf('||');
      if (index === -1) {
        parseString = text;
        mathString = ''; // nothing else
      } else {
        parseString = text.substring(0, index);
        mathString = text.substring(index + 2);
      }
      // We're going to just require ISO8601 timestamps, k?
      time = (0, _moment_wrapper.dateTime)(parseString, _moment_wrapper.ISO_8601);
    }

    if (!mathString.length) {
      return time;
    }

    return parseDateMath(mathString, time, roundUp);
  }
}

/**
 * Checks if text is a valid date which in this context means that it is either a Moment instance or it can be parsed
 * by parse function. See parse function to see what is considered acceptable.
 * @param text
 */
function isValid(text) {
  var date = parse(text);
  if (!date) {
    return false;
  }

  if ((0, _moment_wrapper.isDateTime)(date)) {
    return date.isValid();
  }

  return false;
}

/**
 * Parses math part of the time string and shifts supplied time according to that math. See unit tests for examples.
 * @param mathString
 * @param time
 * @param roundUp If true it will round the time to endOf time unit, otherwise to startOf time unit.
 */
// TODO: Had to revert Andrejs `time: moment.Moment` to `time: any`
function parseDateMath(mathString, time, roundUp) {
  var strippedMathString = mathString.replace(/\s/g, '');
  var dateTime = time;
  var i = 0;
  var len = strippedMathString.length;

  while (i < len) {
    var c = strippedMathString.charAt(i++);
    var type = void 0;
    var num = void 0;
    var unit = void 0;

    if (c === '/') {
      type = 0;
    } else if (c === '+') {
      type = 1;
    } else if (c === '-') {
      type = 2;
    } else {
      return undefined;
    }

    if (isNaN(parseInt(strippedMathString.charAt(i), 10))) {
      num = 1;
    } else if (strippedMathString.length === 2) {
      num = strippedMathString.charAt(i);
    } else {
      var numFrom = i;
      while (!isNaN(parseInt(strippedMathString.charAt(i), 10))) {
        i++;
        if (i > 10) {
          return undefined;
        }
      }
      num = parseInt(strippedMathString.substring(numFrom, i), 10);
    }

    if (type === 0) {
      // rounding is only allowed on whole, single, units (eg M or 1M, not 0.5M or 2M)
      if (num !== 1) {
        return undefined;
      }
    }
    unit = strippedMathString.charAt(i++);

    if (!_lodash2.default.includes(units, unit)) {
      return undefined;
    } else {
      if (type === 0) {
        if (roundUp) {
          dateTime.endOf(unit);
        } else {
          dateTime.startOf(unit);
        }
      } else if (type === 1) {
        dateTime.add(num, unit);
      } else if (type === 2) {
        dateTime.subtract(num, unit);
      }
    }
  }
  return dateTime;
}
//# sourceMappingURL=datemath.js.map
