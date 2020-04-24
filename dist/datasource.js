'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SplunkDatasource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _datemath = require('./datemath');

var dateMath = _interopRequireWildcard(_datemath);

var _splunk_series = require('./splunk_series');

var _splunk_series2 = _interopRequireDefault(_splunk_series);

var _splunk_query = require('./splunk_query');

var _splunk_query2 = _interopRequireDefault(_splunk_query);

var _response_parser = require('./response_parser');

var _response_parser2 = _interopRequireDefault(_response_parser);

var _query_builder = require('./query_builder');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SplunkDatasource = exports.SplunkDatasource = function () {
  function SplunkDatasource(instanceSettings, $q, backendSrv, templateSrv) {
    _classCallCheck(this, SplunkDatasource);

    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = {
      'Content-Type': 'application/json'
    };
    if (typeof c === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
    this.responseParser = new _response_parser2.default();
  }

  // query(options) {
  //   var query = this.buildQueryParameters(options);
  //   query.targets = query.targets.filter(t => !t.hide && typeof t.target !== "undefined");

  //   let instance_url = this.url;
  //   let instance_headers = this.headers;
  //   let instance_creds = this.withCredentials;
  //   let backendSrv = this.backendSrv;
  //   let createColumns = this.createColumns;
  //   let createRows = this.createRows;
  //   let createExportColumns = this.createExportColumns;
  //   let createExportRows = this.createExportRows;
  //   let q = this.q;
  //   let emptyResponse = q.when({
  //     data: []
  //   });

  //   if (query.targets.length <= 0) {
  //     return emptyResponse;
  //   }
  //   //return sampleResponse;

  //   let targetQuery = encodeURI(query.targets[0]['target']);
  //   if (targetQuery === 'undefined' || targetQuery.length === 0) {
  //     return emptyResponse;
  //   }

  //   var get_result_options = {
  //     url: instance_url + '/services/search/jobs/export?output_mode=json_rows',
  //     method: 'POST',
  //     data: 'search=' + targetQuery,
  //     headers: instance_headers,
  //     withCredentials: instance_creds
  //   };
  //   let columns = [];
  //   let rows = [];
  //   let tableResponse = [];

  //   //WORKING
  //   return backendSrv.datasourceRequest(get_result_options).then(function (data) {
  //     createExportColumns(data, columns);
  //     createExportRows(data, rows, columns);
  //     let rowColsTypeCombined = {
  //       "columns": columns,
  //       "rows": rows,
  //       "type": "table"
  //     }
  //     tableResponse.push(rowColsTypeCombined);
  //     console.log(tableResponse);
  //     return q.when({
  //       data: tableResponse
  //     });
  //   });

  // }

  _createClass(SplunkDatasource, [{
    key: 'query',
    value: function query(options) {
      var _this = this;

      var timeFilter = this.getTimeFilter(options);
      var scopedVars = options.scopedVars;
      var targets = _lodash2.default.cloneDeep(options.targets);
      var queryTargets = [];
      var queryModel = void 0;
      var i = void 0,
          y = void 0;

      var allQueries = _lodash2.default.map(targets, function (target) {
        if (target.hide) {
          return '';
        }

        queryTargets.push(target);

        // backward compatibility
        scopedVars.interval = scopedVars.__interval;

        queryModel = new _splunk_query2.default(target, _this.templateSrv, scopedVars);
        return queryModel.render(true);
      }).reduce(function (acc, current) {
        if (current !== '') {
          acc += ';' + current;
        }
        return acc;
      });

      if (allQueries === '') {
        return this.$q.when({ data: [] });
      }

      // add global adhoc filters to timeFilter
      var adhocFilters = this.templateSrv.getAdhocFilters(this.name);
      if (adhocFilters.length > 0) {
        timeFilter += ' AND ' + queryModel.renderAdhocFilters(adhocFilters);
      }

      // replace grafana variables
      scopedVars.timeFilter = { value: timeFilter };

      // replace templated variables
      allQueries = this.templateSrv.replace(allQueries, scopedVars);

      return this._seriesQuery(allQueries, options).then(function (data) {
        if (!data || !data.rows) {
          return [];
        }

        var seriesList = [];
        // for (i = 0; i < data.rows.length; i++) {
        // const result = data.results[i];
        // if (!result || !result.series) {
        //   continue;
        // }

        var target = queryTargets[0];
        var alias = target.alias;
        if (alias) {
          alias = _this.templateSrv.replace(target.alias, options.scopedVars);
        }

        var splunkSeries = new _splunk_series2.default({
          results: data,
          alias: alias
        });

        switch (target.resultFormat) {
          case 'table':
            {
              seriesList.push(splunkSeries.getTable());
              break;
            }
          default:
            {
              var timeSeries = splunkSeries.getTimeSeries();
              for (y = 0; y < timeSeries.length; y++) {
                seriesList.push(timeSeries[y]);
              }
              break;
            }
        }
        // }

        return { data: seriesList };
      });
    }
  }, {
    key: 'annotationQuery',
    value: function annotationQuery(options) {
      var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
      var annotationQuery = {
        range: options.range,
        annotation: {
          name: options.annotation.name,
          datasource: options.annotation.datasource,
          enable: options.annotation.enable,
          iconColor: options.annotation.iconColor,
          query: query
        },
        rangeRaw: options.rangeRaw
      };

      return this.doRequest({
        url: this.url + '/annotations',
        method: 'POST',
        data: annotationQuery
      }).then(function (result) {
        return result.data;
      });
    }
  }, {
    key: 'targetContainsTemplate',
    value: function targetContainsTemplate(target) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = target.groupBy[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var group = _step.value;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = group.params[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var param = _step2.value;

              if (this.templateSrv.variableExists(param)) {
                return true;
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      for (var i in target.tags) {
        if (this.templateSrv.variableExists(target.tags[i].value)) {
          return true;
        }
      }

      return false;
    }
  }, {
    key: 'metricFindQuery',
    value: function metricFindQuery(query, options) {
      var interpolated = this.templateSrv.replace(query, null, 'regex');

      return this._seriesQuery(interpolated, options).then(_lodash2.default.curry(this.responseParser.parse)(query));
    }
  }, {
    key: 'getTagKeys',
    value: function getTagKeys(options) {
      var queryBuilder = new _query_builder.SplunkQueryBuilder({ measurement: '', tags: [] }, this.database);
      var query = queryBuilder.buildExploreQuery('TAG_KEYS');
      return this.metricFindQuery(query, options);
    }
  }, {
    key: 'getTagValues',
    value: function getTagValues(options) {
      var queryBuilder = new _query_builder.SplunkQueryBuilder({ measurement: '', tags: [] }, this.database);
      var query = queryBuilder.buildExploreQuery('TAG_VALUES', options.key);
      return this.metricFindQuery(query, options);
    }
  }, {
    key: '_seriesQuery',
    value: function _seriesQuery(query, options) {
      if (!query) {
        return this.$q.when({ results: [] });
      }

      var query_data = { search: query };

      if (options && options.range) {
        query_data.earliest_time = this.getSplunkTime(options.range.from, false, options.timezone);
        query_data.latest_time = this.getSplunkTime(options.range.from, false, options.timezone);
      }

      return this._splunkRequest("POST", '/services/search/jobs/export', query_data, options);
    }
  }, {
    key: 'serializeParams',
    value: function serializeParams(params) {
      if (!params) {
        return '';
      }

      return _lodash2.default.reduce(params, function (memo, value, key) {
        if (value === null || value === undefined) {
          return memo;
        }
        memo.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        return memo;
      }, []).join('&');
    }
  }, {
    key: 'testDatasource',
    value: function testDatasource() {
      return this.doRequest({
        url: this.url + '/servicesNS/admin',
        method: 'GET',
        headers: this.headers
      }).then(function (response) {
        if (response.status === 200) {
          console.log(response);
          return {
            status: "success",
            message: "Data source is working",
            title: "Success"
          };
        } else {
          return { status: 'error', message: 'Connection failed (' + response.status + ')', title: 'Error' };
        }
      });
    }
  }, {
    key: '_splunkRequest',
    value: function _splunkRequest(method, url, data, options) {

      var params = { output_mode: "json_rows" };

      if (this.username) {
        params.u = this.username;
        params.p = this.password;
      }

      if (method === 'POST' && _lodash2.default.has(data, 'search')) {
        // verb is POST and 'q' param is defined
        _lodash2.default.extend(params, _lodash2.default.omit(data, ['search']));
        data = this.serializeParams(_lodash2.default.pick(data, ['search']));
      } else if (method === 'GET' || method === 'POST') {
        // verb is GET, or POST without 'q' param
        _lodash2.default.extend(params, data);
        data = null;
      }

      var req = {
        method: method,
        url: this.url + url,
        params: params,
        data: data,
        precision: 'ms',
        inspect: { type: 'splunk' },
        paramSerializer: this.serializeParams
      };

      req.headers = req.headers || {};
      if (this.basicAuth || this.withCredentials) {
        req.withCredentials = true;
      }
      if (this.basicAuth) {
        req.headers.Authorization = this.basicAuth;
      }

      if (method === 'POST') {
        req.headers['Content-type'] = 'application/json';
      }

      return this.backendSrv.datasourceRequest(req).then(function (result) {
        return result.data;
      }, function (err) {
        if (err.status !== 0 || err.status >= 300) {
          if (err.data && err.data.error) {
            throw {
              message: 'Splunk Error: ' + err.data.error,
              data: err.data,
              config: err.config
            };
          } else {
            throw {
              message: 'Network Error: ' + err.statusText + '(' + err.status + ')',
              data: err.data,
              config: err.config
            };
          }
        }
      });
    }
  }, {
    key: 'getTimeFilter',
    value: function getTimeFilter(options) {
      var from = this.getSplunkTime(options.rangeRaw.from, false, options.timezone);
      var until = this.getSplunkTime(options.rangeRaw.to, true, options.timezone);
      var fromIsAbsolute = from[from.length - 1] === 'ms';

      if (until === 'now()' && !fromIsAbsolute) {
        return 'time >= ' + from;
      }

      return 'time >= ' + from + ' and time <= ' + until;
    }
  }, {
    key: 'getSplunkTime',
    value: function getSplunkTime(date, roundUp, timezone) {
      if (_lodash2.default.isString(date)) {
        if (date === 'now') {
          return 'now';
        }

        var parts = /^now-(\d+)([dhms])$/.exec(date);
        if (parts) {
          var amount = parseInt(parts[1], 10);
          var unit = parts[2];
          return '-' + amount + unit;
        }
        date = dateMath.parse(date, roundUp, timezone);
      }

      return date.valueOf() / 1000;
    }
  }, {
    key: 'doRequest',
    value: function doRequest(options) {
      options.withCredentials = this.withCredentials;
      options.headers = this.headers;
      // console.log(this.headers);
      return this.backendSrv.datasourceRequest(options);
    }
  }]);

  return SplunkDatasource;
}();
//# sourceMappingURL=datasource.js.map
