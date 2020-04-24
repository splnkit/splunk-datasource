'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _splunk_query_part = require('./splunk_query_part');

var _splunk_query_part2 = _interopRequireDefault(_splunk_query_part);

var _kbn = require('app/core/utils/kbn');

var _kbn2 = _interopRequireDefault(_kbn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SplunkQuery = function () {

  /** @ngInject */
  function SplunkQuery(target, templateSrv, scopedVars) {
    _classCallCheck(this, SplunkQuery);

    this.target = target;
    this.templateSrv = templateSrv;
    this.scopedVars = scopedVars;

    target.index = target.index || '*';
    target.resultFormat = target.resultFormat || 'time_series';
    target.orderByTime = target.orderByTime || 'ASC';
    target.tags = target.tags || [];
    target.groupBy = target.groupBy || [{ type: 'time', params: ['$__interval'] }, { type: 'fill', params: ['null'] }];
    target.select = target.select || [[{ type: 'field', params: ['value'] }, { type: 'avg', params: [] }]];

    this.updateProjection();
  }

  _createClass(SplunkQuery, [{
    key: 'updateProjection',
    value: function updateProjection() {
      this.selectModels = _lodash2.default.map(this.target.select, function (parts) {
        return _lodash2.default.map(parts, _splunk_query_part2.default.create);
      });
      this.groupByParts = _lodash2.default.map(this.target.groupBy, _splunk_query_part2.default.create);
    }
  }, {
    key: 'updatePersistedParts',
    value: function updatePersistedParts() {
      this.target.select = _lodash2.default.map(this.selectModels, function (selectParts) {
        return _lodash2.default.map(selectParts, function (part) {
          return { type: part.def.type, params: part.params };
        });
      });
    }
  }, {
    key: 'hasGroupByTime',
    value: function hasGroupByTime() {
      return _lodash2.default.find(this.target.groupBy, function (g) {
        return g.type === 'time';
      });
    }
  }, {
    key: 'hasFill',
    value: function hasFill() {
      return _lodash2.default.find(this.target.groupBy, function (g) {
        return g.type === 'fill';
      });
    }
  }, {
    key: 'addGroupBy',
    value: function addGroupBy(value) {
      var stringParts = value.match(/^(\w+)\((.*)\)$/);
      var typePart = stringParts[1];
      var arg = stringParts[2];
      var partModel = _splunk_query_part2.default.create({ type: typePart, params: [arg] });
      var partCount = this.target.groupBy.length;

      if (partCount === 0) {
        this.target.groupBy.push(partModel.part);
      } else if (typePart === 'time') {
        this.target.groupBy.splice(0, 0, partModel.part);
      } else if (typePart === 'tag') {
        if (this.target.groupBy[partCount - 1].type === 'fill') {
          this.target.groupBy.splice(partCount - 1, 0, partModel.part);
        } else {
          this.target.groupBy.push(partModel.part);
        }
      } else {
        this.target.groupBy.push(partModel.part);
      }

      this.updateProjection();
    }
  }, {
    key: 'removeGroupByPart',
    value: function removeGroupByPart(part, index) {
      var categories = _splunk_query_part2.default.getCategories();

      if (part.def.type === 'time') {
        // remove fill
        this.target.groupBy = _lodash2.default.filter(this.target.groupBy, function (g) {
          return g.type !== 'fill';
        });
        // remove aggregations
        this.target.select = _lodash2.default.map(this.target.select, function (s) {
          return _lodash2.default.filter(s, function (part) {
            var partModel = _splunk_query_part2.default.create(part);
            if (partModel.def.category === categories.Aggregations) {
              return false;
            }
            if (partModel.def.category === categories.Selectors) {
              return false;
            }
            return true;
          });
        });
      }

      this.target.groupBy.splice(index, 1);
      this.updateProjection();
    }
  }, {
    key: 'removeSelect',
    value: function removeSelect(index) {
      this.target.select.splice(index, 1);
      this.updateProjection();
    }
  }, {
    key: 'removeSelectPart',
    value: function removeSelectPart(selectParts, part) {
      // if we remove the field remove the whole statement
      if (part.def.type === 'field') {
        if (this.selectModels.length > 1) {
          var modelsIndex = _lodash2.default.indexOf(this.selectModels, selectParts);
          this.selectModels.splice(modelsIndex, 1);
        }
      } else {
        var partIndex = _lodash2.default.indexOf(selectParts, part);
        selectParts.splice(partIndex, 1);
      }

      this.updatePersistedParts();
    }
  }, {
    key: 'addSelectPart',
    value: function addSelectPart(selectParts, type) {
      var partModel = _splunk_query_part2.default.create({ type: type });
      partModel.def.addStrategy(selectParts, partModel, this);
      this.updatePersistedParts();
    }
  }, {
    key: 'renderTagCondition',
    value: function renderTagCondition(tag, index, interpolate) {
      var str = '';
      var operator = tag.operator;
      var value = tag.value;
      if (index > 0) {
        str = (tag.condition || 'AND') + ' ';
      }

      if (!operator) {
        if (/^\/.*\/$/.test(value)) {
          operator = '=~';
        } else {
          operator = '=';
        }
      }

      // quote value unless regex
      if (operator !== '=~' && operator !== '!~') {
        if (interpolate) {
          value = this.templateSrv.replace(value, this.scopedVars);
        }
        if (operator !== '>' && operator !== '<') {
          value = "'" + value.replace(/\\/g, '\\\\') + "'";
        }
      } else if (interpolate) {
        value = this.templateSrv.replace(value, this.scopedVars, 'regex');
      }

      return str + '"' + tag.key + '" ' + operator + ' ' + value;
    }
  }, {
    key: 'getMeasurementAndPolicy',
    value: function getMeasurementAndPolicy(interpolate) {
      var index = this.target.index;
      var measurement = this.target.measurement || 'measurement';

      if (!measurement.match('^/.*/$')) {
        measurement = '"' + measurement + '"';
      } else if (interpolate) {
        measurement = this.templateSrv.replace(measurement, this.scopedVars, 'regex');
      }

      if (index !== 'default') {
        index = '"' + this.target.index + '".';
      } else {
        index = '';
      }

      return index + measurement;
    }
  }, {
    key: 'interpolateQueryStr',
    value: function interpolateQueryStr(value, variable, defaultFormatFn) {
      // if no multi or include all do not regexEscape
      if (!variable.multi && !variable.includeAll) {
        return value;
      }

      if (typeof value === 'string') {
        return _kbn2.default.regexEscape(value);
      }

      var escapedValues = _lodash2.default.map(value, _kbn2.default.regexEscape);
      return '(' + escapedValues.join('|') + ')';
    }
  }, {
    key: 'render',
    value: function render(interpolate) {
      var _this = this;

      var target = this.target;

      if (target.rawQuery) {
        if (interpolate) {
          return this.templateSrv.replace(target.query, this.scopedVars, this.interpolateQueryStr);
        } else {
          return target.query;
        }
      }

      var query = '| mstats ';
      var i = void 0,
          y = void 0;
      for (i = 0; i < this.selectModels.length; i++) {
        var parts = this.selectModels[i];
        var selectText = '';
        for (y = 0; y < parts.length; y++) {
          var part = parts[y];
          selectText = part.render(selectText);
        }

        if (i > 0) {
          query += ', ';
        }
        query += selectText;
      }

      query += ' WHERE ';
      var conditions = _lodash2.default.map(target.tags, function (tag, index) {
        return _this.renderTagCondition(tag, index, interpolate);
      });

      if (conditions.length > 0) {
        query += '(' + conditions.join(' ') + ') AND ';
      }

      var groupBySection = '';
      for (i = 0; i < this.groupByParts.length; i++) {
        var _part = this.groupByParts[i];
        if (i > 0) {
          // for some reason fill has no separator
          groupBySection += _part.def.type === 'fill' ? ' ' : ', ';
        }
        groupBySection += _part.render('');
      }

      if (groupBySection.length) {
        query += ' BY ' + groupBySection;
      }

      if (target.fill) {
        query += ' fill(' + target.fill + ')';
      }

      if (target.orderByTime === 'DESC') {
        query += ' ORDER BY time DESC';
      }

      if (target.limit) {
        query += ' LIMIT ' + target.limit;
      }

      if (target.slimit) {
        query += ' SLIMIT ' + target.slimit;
      }

      if (target.tz) {
        query += " tz('" + target.tz + "')";
      }

      return query;
    }
  }, {
    key: 'renderAdhocFilters',
    value: function renderAdhocFilters(filters) {
      var _this2 = this;

      var conditions = _lodash2.default.map(filters, function (tag, index) {
        return _this2.renderTagCondition(tag, index, false);
      });
      return conditions.join(' ');
    }
  }]);

  return SplunkQuery;
}();

exports.default = SplunkQuery;
//# sourceMappingURL=splunk_query.js.map
