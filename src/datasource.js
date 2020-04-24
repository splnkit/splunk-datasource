import _ from "lodash";

import * as dateMath from './datemath';
import SplunkSeries from './splunk_series';
import SplunkQuery from './splunk_query';
import ResponseParser from './response_parser';
import { SplunkQueryBuilder } from './query_builder';

export class SplunkDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
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
    this.responseParser = new ResponseParser();
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

  query(options) {
    let timeFilter = this.getTimeFilter(options);
    const scopedVars = options.scopedVars;
    const targets = _.cloneDeep(options.targets);
    const queryTargets = [];
    let queryModel;
    let i, y;

    let allQueries = _.map(targets, target => {
      if (target.hide) {
        return '';
      }

      queryTargets.push(target);

      // backward compatibility
      scopedVars.interval = scopedVars.__interval;

      queryModel = new SplunkQuery(target, this.templateSrv, scopedVars);
      return queryModel.render(true);
    }).reduce((acc, current) => {
      if (current !== '') {
        acc += ';' + current;
      }
      return acc;
    });

    if (allQueries === '') {
      return this.$q.when({ data: [] });
    }

    // add global adhoc filters to timeFilter
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    if (adhocFilters.length > 0) {
      timeFilter += ' AND ' + queryModel.renderAdhocFilters(adhocFilters);
    }

    // replace grafana variables
    scopedVars.timeFilter = { value: timeFilter };

    // replace templated variables
    allQueries = this.templateSrv.replace(allQueries, scopedVars);

    return this._seriesQuery(allQueries, options).then(
      (data) => {
        if (!data || !data.rows) {
          return [];
        }

        const seriesList = [];
        // for (i = 0; i < data.rows.length; i++) {
          // const result = data.results[i];
          // if (!result || !result.series) {
          //   continue;
          // }

          const target = queryTargets[0];
          let alias = target.alias;
          if (alias) {
            alias = this.templateSrv.replace(target.alias, options.scopedVars);
          }

          const splunkSeries = new SplunkSeries({
            results: data,
            alias: alias,
          });

          switch (target.resultFormat) {
            case 'table': {
              seriesList.push(splunkSeries.getTable());
              break;
            }
            default: {
              const timeSeries = splunkSeries.getTimeSeries();
              for (y = 0; y < timeSeries.length; y++) {
                seriesList.push(timeSeries[y]);
              }
              break;
            }
          }
        // }

        return { data: seriesList };
      }
    );
  }

  annotationQuery(options) {
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
    }).then(result => {
      return result.data;
    });
  }

  targetContainsTemplate(target) {
    for (const group of target.groupBy) {
      for (const param of group.params) {
        if (this.templateSrv.variableExists(param)) {
          return true;
        }
      }
    }

    for (const i in target.tags) {
      if (this.templateSrv.variableExists(target.tags[i].value)) {
        return true;
      }
    }

    return false;
  }

  metricFindQuery(query, options) {
    const interpolated = this.templateSrv.replace(query, null, 'regex');

    return this._seriesQuery(interpolated, options).then(_.curry(this.responseParser.parse)(query));
  }

  getTagKeys(options) {
    const queryBuilder = new SplunkQueryBuilder({ measurement: '', tags: [] }, this.database);
    const query = queryBuilder.buildExploreQuery('TAG_KEYS');
    return this.metricFindQuery(query, options);
  }

  getTagValues(options) {
    const queryBuilder = new SplunkQueryBuilder({ measurement: '', tags: [] }, this.database);
    const query = queryBuilder.buildExploreQuery('TAG_VALUES', options.key);
    return this.metricFindQuery(query, options);
  }


  _seriesQuery(query, options) {
    if (!query) {
      return this.$q.when({ results: [] });
    }

    let query_data = { search: query }

    if (options && options.range) {
      query_data.earliest_time = this.getSplunkTime(options.range.from, false, options.timezone);
      query_data.latest_time = this.getSplunkTime(options.range.from, false, options.timezone);
    }

    return this._splunkRequest("POST", '/services/search/jobs/export', query_data, options);
  }

  serializeParams(params) {
    if (!params) {
      return '';
    }

    return _.reduce(
      params,
      (memo, value, key) => {
        if (value === null || value === undefined) {
          return memo;
        }
        memo.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        return memo;
      },
      []
    ).join('&');
  }

  testDatasource() {
    return this.doRequest({
      url: this.url + '/servicesNS/admin',
      method: 'GET',
      headers: this.headers
    }).then(response => {
      if (response.status === 200) {
        console.log(response);
        return {
          status: "success",
          message: "Data source is working",
          title: "Success"
        };
      } else {
        return { status: 'error', message: `Connection failed (${response.status})`, title: 'Error' };
      }
    });
  }

  _splunkRequest(method, url, data, options) {

    const params = { output_mode: "json_rows" };

    if (this.username) {
      params.u = this.username;
      params.p = this.password;
    }

    if (method === 'POST' && _.has(data, 'search')) {
      // verb is POST and 'q' param is defined
      _.extend(params, _.omit(data, ['search']));
      data = this.serializeParams(_.pick(data, ['search']));
    } else if (method === 'GET' || method === 'POST') {
      // verb is GET, or POST without 'q' param
      _.extend(params, data);
      data = null;
    }

    const req = {
      method: method,
      url: this.url + url,
      params: params,
      data: data,
      precision: 'ms',
      inspect: { type: 'splunk' },
      paramSerializer: this.serializeParams,
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

    return this.backendSrv.datasourceRequest(req).then(
      result => {
        return result.data;
      },
      err => {
        if (err.status !== 0 || err.status >= 300) {
          if (err.data && err.data.error) {
            throw {
              message: 'Splunk Error: ' + err.data.error,
              data: err.data,
              config: err.config,
            };
          } else {
            throw {
              message: 'Network Error: ' + err.statusText + '(' + err.status + ')',
              data: err.data,
              config: err.config,
            };
          }
        }
      }
    );
  }

  getTimeFilter(options) {
    const from = this.getSplunkTime(options.rangeRaw.from, false, options.timezone);
    const until = this.getSplunkTime(options.rangeRaw.to, true, options.timezone);
    const fromIsAbsolute = from[from.length - 1] === 'ms';

    if (until === 'now()' && !fromIsAbsolute) {
      return 'time >= ' + from;
    }

    return 'time >= ' + from + ' and time <= ' + until;
  }

  getSplunkTime(date, roundUp, timezone) {
    if (_.isString(date)) {
      if (date === 'now') {
        return 'now';
      }

      const parts = /^now-(\d+)([dhms])$/.exec(date);
      if (parts) {
        const amount = parseInt(parts[1], 10);
        const unit = parts[2];
        return '-' + amount + unit;
      }
      date = dateMath.parse(date, roundUp, timezone);
    }

    return date.valueOf()/1000;
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;
    // console.log(this.headers);
    return this.backendSrv.datasourceRequest(options);
  }
}