'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SplunkQueryBuilder = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _kbn = require('app/core/utils/kbn');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function renderTagCondition(tag, index) {
  var str = '';
  var operator = tag.operator;
  var value = tag.value;
  if (index > 0) {
    str = (tag.condition || 'AND') + ' ';
  }

  if (!operator) {
    if (/^\/.*\/$/.test(tag.value)) {
      operator = '=~';
    } else {
      operator = '=';
    }
  }

  // quote value unless regex or number
  if (operator !== '=~' && operator !== '!~' && isNaN(+value)) {
    value = "'" + value + "'";
  }

  return str + '"' + tag.key + '" ' + operator + ' ' + value;
}

var SplunkQueryBuilder = exports.SplunkQueryBuilder = function () {
  function SplunkQueryBuilder(target) {
    _classCallCheck(this, SplunkQueryBuilder);
  }

  _createClass(SplunkQueryBuilder, [{
    key: 'buildExploreQuery',
    value: function buildExploreQuery(type, withKey, withMeasurementFilter) {
      var query = void 0;
      var measurement = void 0;
      var index = void 0;

      if (type === 'FIELD_NAMES') {
        query = '| mcatalog values(_dims)';
        measurement = this.target.measurement;
        index = this.target.index;
      } else if (type === 'FIELD_VALUES') {
        query = '| mcatalog values()';
        measurement = this.target.measurement;
        index = this.target.index;
      } else if (type === 'METRIC_NAMES') {
        query = '| mcatalog values(metric_name)';
        if (withMeasurementFilter) {
          query += ' where MEASUREMENT =~ /' + _kbn.kbn.regexEscape(withMeasurementFilter) + '/';
        }
      } else if (type === 'FIELDS') {
        measurement = this.target.measurement;
        index = this.target.index;

        if (!measurement.match('^/.*/')) {
          measurement = '"' + measurement + '"';

          if (index && index !== 'default') {
            index = '"' + index + '"';
            measurement = index + '.' + measurement;
          }
        }

        return 'SHOW FIELD KEYS FROM ' + measurement;
      } else if (type === 'INDEXES') {
        query = '| mcatalog values(_dims) where index="' + this.database + '*" | table index';
        return query;
      }

      if (measurement) {
        if (!measurement.match('^/.*/') && !measurement.match(/^merge\(.*\)/)) {
          measurement = '"' + measurement + '"';
        }

        if (index && index !== 'default') {
          index = '"' + index + '"';
          measurement = index + '.' + measurement;
        }

        query += ' where ' + measurement;
      }

      if (withKey) {
        query += ' WITH KEY = "' + withKey + '"';
      }

      if (this.target.tags && this.target.tags.length > 0) {
        var whereConditions = _lodash._.reduce(this.target.tags, function (memo, tag) {
          // do not add a condition for the key we want to explore for
          if (tag.key === withKey) {
            return memo;
          }
          memo.push(renderTagCondition(tag, memo.length));
          return memo;
        }, []);

        if (whereConditions.length > 0) {
          query += ' WHERE ' + whereConditions.join(' ');
        }
      }
      if (type === 'METRIC_NAMES') {
        query += ' | ';
        //Solve issue #2524 by limiting the number of measurements returned
        //LIMIT must be after WITH MEASUREMENT and WHERE clauses
        //This also could be used for TAG KEYS and TAG VALUES, if desired
      }
      return query;
    }
  }]);

  return SplunkQueryBuilder;
}();
//# sourceMappingURL=query_builder.js.map
