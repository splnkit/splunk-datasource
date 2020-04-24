'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _datemath = require('./datemath');

var dateMath = _interopRequireWildcard(_datemath);

var _table_model = require('app/core/table_model');

var _ui = require('@grafana/ui');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SplunkSeries = function () {
  function SplunkSeries(options) {
    _classCallCheck(this, SplunkSeries);

    this.results = options.results;
    this.alias = options.alias;
    this.annotation = options.annotation;
  }

  _createClass(SplunkSeries, [{
    key: 'getTimeSeries',
    value: function getTimeSeries() {
      var output = [];
      var i = void 0,
          j = void 0;

      if (this.results.rows.length === 0) {
        return output;
      }

      var results = this.results;
      var columns = results.fields.length;
      var time_column = results.fields.indexOf("_time");
      // const tags = _.map(results.tags, (value, key) => {
      //   return key + ': ' + value;
      // });

      for (j = 0; j < columns; j++) {
        if (j == time_column) {
          continue;
        }
        var columnName = results.fields[j];
        var rowsName = columnName;

        // if (this.alias) {
        //   rowsName = this._getSeriesName(rows, j);
        // } else if (rows.tags) {
        //   rowsName = rowsName + ' {' + tags.join(', ') + '}';
        // }

        var datapoints = [];
        if (results.rows) {
          for (i = 0; i < results.rows.length; i++) {
            var tz = results.rows[i][time_column].split(" ")[-1];
            var time_string = results.rows[i][time_column].split(" ").slice(0, 2).join(" ");
            datapoints[i] = [parseFloat(results.rows[i][j]), dateMath.parse(time_string, false, tz).valueOf()];
          }
        }

        output.push({ target: rowsName, datapoints: datapoints });
      }

      return output;
    }
  }, {
    key: '_getSeriesName',
    value: function _getSeriesName(rows, index) {
      var regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
      var segments = rows.name.split('.');

      return this.alias.replace(regex, function (match, g1, g2) {
        var group = g1 || g2;
        var segIndex = parseInt(group, 10);

        if (group === 'm' || group === 'measurement') {
          return rows.name;
        }
        if (group === 'col') {
          return rows.columns[index];
        }
        if (!isNaN(segIndex)) {
          return segments[segIndex];
        }
        if (group.indexOf('tag_') !== 0) {
          return match;
        }

        var tag = group.replace('tag_', '');
        if (!rows.tags) {
          return match;
        }
        return rows.tags[tag];
      });
    }
  }, {
    key: 'getAnnotations',
    value: function getAnnotations() {
      var _this = this;

      var list = [];

      var titleCol = null;
      var timeCol = null;
      var tagsCol = [];
      var textCol = null;

      _lodash._.each(this.results.fields, function (column, index) {
        if (column === '_time') {
          timeCol = index;
          return;
        }
        if (column === 'sequence_number') {
          return;
        }
        if (column === _this.annotation.titleColumn) {
          titleCol = index;
          return;
        }
        if (_lodash._.includes((_this.annotation.tagsColumn || '').replace(' ', '').split(','), column)) {
          tagsCol.push(index);
          return;
        }
        if (column === _this.annotation.textColumn) {
          textCol = index;
          return;
        }
        // legacy case
        if (!titleCol && textCol !== index) {
          titleCol = index;
        }
      });

      _lodash._.each(this.results.rows, function (row) {
        var data = {
          annotation: _this.annotation,
          time: +new Date(row[timeCol]),
          title: row[titleCol],
          // Remove empty rows, then split in different tags for comma separated rows
          tags: _lodash._.flatten(tagsCol.filter(function (t) {
            return row[t];
          }).map(function (t) {
            return row[t].split(',');
          })),
          text: row[textCol]
        };

        list.push(data);
      });

      return list;
    }
  }, {
    key: 'getTable',
    value: function getTable() {
      var table = new _table_model.TableModel();
      var i = void 0,
          j = void 0;

      if (this.results.rows.length === 0) {
        return table;
      }

      j = 0;
      // Check that the first column is indeed 'time'
      if (this.results.fields[0] === '_time') {
        // Push this now before the tags and with the right type
        table.columns.push({ text: 'Time', type: _ui.FieldType.time });
        j++;
      }
      // _.each(_.keys(rows.tags), key => {
      //   table.columns.push({ text: key });
      // });
      for (; j < this.results.fields.length; j++) {
        table.columns.push({ text: this.results.fields[j] });
      }

      if (this.results.rows) {
        for (i = 0; i < this.results.rows.length; i++) {
          var values = this.results.rows[i];
          var reordered = [values[0]];
          // if (rows.tags) {
          //   for (const key in rows.tags) {
          //     if (rows.tags.hasOwnProperty(key)) {
          //       reordered.push(rows.tags[key]);
          //     }
          //   }
          // }
          for (j = 1; j < values.length; j++) {
            reordered.push(values[j]);
          }
          table.rows.push(reordered);
        }
      }

      return table;
    }
  }]);

  return SplunkSeries;
}();

exports.default = SplunkSeries;
//# sourceMappingURL=splunk_series.js.map
