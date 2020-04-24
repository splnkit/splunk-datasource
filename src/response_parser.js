import { _ } from 'lodash';

export default class ResponseParser {

  parse(query, results) {
    if (!results || results.rows.length === 0) {
      return [];
    }

    const splunkResults = results.rows;

    const res = {};
    _.each(splunkResults, row => {
      if (_.isArray(row)) {
          addUnique(res, value[0]);
      } else {
        addUnique(res, value);
      }
    });

    return _.map(res, value => {
      return { text: value.toString() };
    });
  }
}

function addUnique(arr, value) {
  arr[value] = value;
}

//TODO: Change the type of the column dynamically and add support for _si.
function createColumns(data, columns) {
  if (columns.length > 0) {
    return;
  }
  let field_names = data['data']['fields'];
  _.map(field_names, function (field_name) {
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
  let field_values = data['data']['results'];
  _.map(field_values, function (row) {
    let temp_row = [];
    columns.forEach(column => {
      temp_row.push(row[column['text']]);
    });
    rows.push(temp_row);
  });
}

function createExportColumns(data, columns) {
  if (columns.length > 0) {
    return;
  }
  let field_names = data['data']['fields'];
  _.map(field_names, function (field_name) {
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
  let results = data['data']['rows'];
  _.map(results, function (row) {
    rows.push(row);
  });
}