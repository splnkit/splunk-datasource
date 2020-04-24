import { _ } from 'lodash';
import { kbn } from 'app/core/utils/kbn';

function renderTagCondition(tag, index) {
  let str = '';
  let operator = tag.operator;
  let value = tag.value;
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

export class SplunkQueryBuilder {
  constructor(target) {}

  buildExploreQuery(type, withKey, withMeasurementFilter) {
    let query;
    let measurement;
    let index;

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
        query += ' where MEASUREMENT =~ /' + kbn.regexEscape(withMeasurementFilter) + '/';
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
      const whereConditions = _.reduce(
        this.target.tags,
        (memo, tag) => {
          // do not add a condition for the key we want to explore for
          if (tag.key === withKey) {
            return memo;
          }
          memo.push(renderTagCondition(tag, memo.length));
          return memo;
        },
        []
      );

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
}