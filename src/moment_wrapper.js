import moment from 'moment';


export const ISO_8601 = moment.ISO_8601;

export const setLocale = (language) => {
  moment.locale(language);
};

export const getLocaleData = () => {
  return moment.localeData();
};

export const isDateTime = (value) => {
  return moment.isMoment(value);
};

export const toUtc = (input, formatInput) => {
  return moment.utc(input, formatInput);
};

export const toDuration = (input, unit) => {
  return moment.duration(input, unit);
};

export const dateTime = (input, formatInput) => {
  return moment(input, formatInput);
};

export const dateTimeForTimeZone = (
  timezone,
  input,
  formatInput
) => {
  if (timezone === 'utc') {
    return toUtc(input, formatInput);
  }

  return dateTime(input, formatInput);
};