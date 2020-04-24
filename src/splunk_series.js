import { _ } from 'lodash';

import * as dateMath from './datemath';
import { TableModel } from 'app/core/table_model';
import { FieldType } from '@grafana/ui';

export default class SplunkSeries {

  constructor(options) {
    this.results = options.results;
    this.alias = options.alias;
    this.annotation = options.annotation;
  }

  getTimeSeries() {
    const output = [];
    let i, j;

    if (this.results.rows.length === 0) {
      return output;
    }

    let results = this.results;
    const columns = results.fields.length;
    const time_column = results.fields.indexOf("_time");
    // const tags = _.map(results.tags, (value, key) => {
    //   return key + ': ' + value;
    // });

    for (j = 0; j < columns; j++) {
      if (j == time_column) {
        continue
      }
      const columnName = results.fields[j];
      let rowsName = columnName;

      // if (this.alias) {
      //   rowsName = this._getSeriesName(rows, j);
      // } else if (rows.tags) {
      //   rowsName = rowsName + ' {' + tags.join(', ') + '}';
      // }

      const datapoints = [];
      if (results.rows) {
        for (i = 0; i < results.rows.length; i++) {
          let tz = results.rows[i][time_column].split(" ")[-1];
          let time_string = results.rows[i][time_column].split(" ").slice(0,2).join(" ");
          datapoints[i] = [parseFloat(results.rows[i][j]), dateMath.parse(time_string, false, tz).valueOf()];
        }
      }

      output.push({ target: rowsName, datapoints: datapoints });
    }

    return output;
  }

  _getSeriesName(rows, index) {
    const regex = /\$(\w+)|\[\[([\s\S]+?)\]\]/g;
    const segments = rows.name.split('.');

    return this.alias.replace(regex, (match, g1, g2) => {
      const group = g1 || g2;
      const segIndex = parseInt(group, 10);

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

      const tag = group.replace('tag_', '');
      if (!rows.tags) {
        return match;
      }
      return rows.tags[tag];
    });
  }

  getAnnotations() {
    const list = [];

    let titleCol = null;
    let timeCol = null;
    const tagsCol = [];
    let textCol = null;

    _.each(this.results.fields, (column, index) => {
      if (column === '_time') {
        timeCol = index;
        return;
      }
      if (column === 'sequence_number') {
        return;
      }
      if (column === this.annotation.titleColumn) {
        titleCol = index;
        return;
      }
      if (_.includes((this.annotation.tagsColumn || '').replace(' ', '').split(','), column)) {
        tagsCol.push(index);
        return;
      }
      if (column === this.annotation.textColumn) {
        textCol = index;
        return;
      }
      // legacy case
      if (!titleCol && textCol !== index) {
        titleCol = index;
      }
    });

    _.each(this.results.rows, row => {
      const data = {
        annotation: this.annotation,
        time: +new Date(row[timeCol]),
        title: row[titleCol],
        // Remove empty rows, then split in different tags for comma separated rows
        tags: _.flatten(
          tagsCol
            .filter(t => {
              return row[t];
            })
            .map(t => {
              return row[t].split(',');
            })
        ),
        text: row[textCol],
      };

      list.push(data);
    });

    return list;
  }

  getTable() {
    const table = new TableModel();
    let i, j;

    if (this.results.rows.length === 0) {
      return table;
    }

    j = 0;
    // Check that the first column is indeed 'time'
    if (this.results.fields[0] === '_time') {
      // Push this now before the tags and with the right type
      table.columns.push({ text: 'Time', type: FieldType.time });
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
        const values = this.results.rows[i];
        const reordered = [values[0]];
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
}