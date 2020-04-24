'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ResponseParser = function () {
  function ResponseParser() {
    _classCallCheck(this, ResponseParser);
  }

  _createClass(ResponseParser, [{
    key: 'parse',
    value: function parse(query, results) {
      if (!results || results.rows.length === 0) {
        return [];
      }

      var splunkResults = results.rows;

      var res = {};
      _lodash._.each(splunkResults, function (row) {
        if (_lodash._.isArray(row)) {
          addUnique(res, value[0]);
        } else {
          addUnique(res, value);
        }
      });

      return _lodash._.map(res, function (value) {
        return { text: value.toString() };
      });
    }
  }]);

  return ResponseParser;
}();

exports.default = ResponseParser;


function addUnique(arr, value) {
  arr[value] = value;
}

//TODO: Change the type of the column dynamically and add support for _si.
function createColumns(data, columns) {
  if (columns.length > 0) {
    return;
  }
  var field_names = data['data']['fields'];
  _lodash._.map(field_names, function (field_name) {
    if (field_name['name'] != '_si') {
      columns.push({
        "text": field_name['name'],
        "type": "string"
      });
    }
  });
}

function createRows(data, rows, columns) {
  if (rows.length > 0) {
    return;
  }
  var field_values = data['data']['results'];
  _lodash._.map(field_values, function (row) {
    var temp_row = [];
    columns.forEach(function (column) {
      temp_row.push(row[column['text']]);
    });
    rows.push(temp_row);
  });
}

function createExportColumns(data, columns) {
  if (columns.length > 0) {
    return;
  }
  var field_names = data['data']['fields'];
  _lodash._.map(field_names, function (field_name) {
    columns.push({
      "text": field_name,
      "type": "string"
    });
  });
}

function createExportRows(data, rows, columns) {
  if (rows.length > 0) {
    return;
  }
  var results = data['data']['rows'];
  _lodash._.map(results, function (row) {
    rows.push(row);
  });
}
//# sourceMappingURL=response_parser.js.map
