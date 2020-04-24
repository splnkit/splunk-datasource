'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TIME_FORMAT = exports.DefaultTimeZone = undefined;

var _moment_wrapper = require('./moment_wrapper');

// export interface RawTimeRange {
//   from: DateTime | string;
//   to: DateTime | string;
// }

// export interface TimeRange {
//   from: DateTime;
//   to: DateTime;
//   raw: RawTimeRange;
// }

// export interface AbsoluteTimeRange {
//   from: number;
//   to: number;
// }

// export interface IntervalValues {
//   interval: string; // 10s,5m
//   intervalMs: number;
// }

// export type TimeZoneUtc = 'utc';
// export type TimeZoneBrowser = 'browser';
// export type TimeZone = TimeZoneBrowser | TimeZoneUtc | string;

var DefaultTimeZone = exports.DefaultTimeZone = 'browser';

// export interface TimeOption {
//   from: string;
//   to: string;
//   display: string;
//   section: number;
// }

// export interface TimeOptions {
//   [key: string]: TimeOption[];
// }

// export type TimeFragment = string | DateTime;

var TIME_FORMAT = exports.TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
//# sourceMappingURL=time_type.js.map
