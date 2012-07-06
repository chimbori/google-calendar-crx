// Copyright 2010 and onwards Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Calendar-related utils, all grouped together as static
 * methods of the CalendarUtils class defined here.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * CalendarUtils exposes several static methods.
 * @constructor
 */
function CalendarUtils() {
  // Nothing
}


/**
 * Given a date in JavaScript format, convert it to a type that Google
 * Calendar likes.
 * @param {Date} date Date to convert.
 * @return {string} Date in (almost but not quite) ISO 8601 format.
 */
CalendarUtils.getDateGoogleCalendar = function(date) {
  var dateIso = [
      date.getFullYear(),
      common.zeroPad(date.getMonth() + 1),
      common.zeroPad(date.getDate())].join('');

  // If the time is exactly midnight, this might be an all-day event.
  if (date.getHours() !== 0 || date.getMinutes() !== 0) {
    dateIso += [
        'T',
        common.zeroPad(date.getHours()),
        common.zeroPad(date.getMinutes()),
        '00'].join('');
  }

  return dateIso;
};


/**
 * Convert time that looks like '10:00am' or '6:00PM' to ISO 8601 format.
 * @param {string} time Time that looks like '10:00am' or '6:00PM'.
 * @return {string} Time (without a date) in ISO 8601 format.
 */
CalendarUtils.amPmTimeToIso8601 = function(time) {
  var parts = time.toLowerCase().match(/([0-9]{1,2}):([0-9]{2})(am|pm)/);
  return [
      (parts[3] == 'am') ? parts[1] : 12 + parseInt(parts[1], 10),
      ':', parts[2], ':00'
      ].join('');
};


/**
 * Parse ISO 8601 date/time into a JavaScript date.
 * ** This function adapted from GData's JavaScript Date/time parser. **
 * @param {string} s ISO 8601 date as a string.
 * @return {Date} Parsed JavaScript date object.
 */
CalendarUtils.fromIso8601 = function(s) {
  var parsed = '';
  if (parsed = s.match(new RegExp(/(\d{4})(-)?(\d{2})(-)?(\d{2})(T)?(\d{2})(:)?(\d{2})(:)?(\d{2})?(\.\d+)?(Z|([+\-])(\d{2})(:)?(\d{2}))?/))) {
    if (parsed[13] === 'Z') {
      var date = new Date();
      date.setUTCFullYear(parseInt(parsed[1], 10));
      date.setUTCMonth(parseInt(parsed[3], 10) - 1);
      date.setUTCDate(parseInt(parsed[5], 10));
      date.setUTCHours(parseInt(parsed[7], 10));
      date.setUTCMinutes(parseInt(parsed[9], 10));
      date.setUTCSeconds(parseInt(parsed[11], 10) || 0);
      return date;
    } else {
      return new Date(
          parseInt(parsed[1], 10),
          parseInt(parsed[3], 10) - 1,
          parseInt(parsed[5], 10),
          parseInt(parsed[7], 10),
          parseInt(parsed[9], 10),
          parseInt(parsed[11], 10) || 0);
    }

  } else if (parsed = s.match(new RegExp(/(\d{4})(-)?(\d{2})(-)?(\d{2})/))) {
    // Parse as just a date, no time.
    return new Date(parsed[1], parseInt(parsed[3], 10) - 1, parsed[5]);

  } else if (parsed = s.match(new RegExp(
      /(\d{1,2})(:)?(\d{2})(:)?(\d{2})(\.\d+)?(Z|([+\-])(\d\d)(:)?(\d\d))?/))) {
    // Parse as just a time, no date.
    var now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parsed[1],
        parseInt(parsed[3], 10) - 1,
        parsed[5]);

  } else {
    return null;
  }
};


/**
 * Display a time duration, taking into account the from, to, and current date.
 * @param {Date} fromDate A JavaScript date.
 * @param {Date} toDate A JavaScript date.
 * @return {string} A human-readable date.
 */
CalendarUtils.getFormattedDatesFromTo = function(fromDate, toDate) {
  var now = new Date();
  var niceDate = '';

  // Show the year only if different from the current year.
  if (now.getFullYear() != fromDate.getFullYear()) {
    niceDate = ', ' + fromDate.getFullYear();
  }

  // Append the internationalized name of the month. And date.
  niceDate = chrome.i18n.getMessage('month_' + (fromDate.getMonth() + 1)) +
      ' ' + fromDate.getDate() + niceDate + ' &nbsp; &bull; &nbsp; ';

  // Skip the ":00" if the time is on the hour.
  var hour12hr = fromDate.getHours() % 12;
  hour12hr = (hour12hr === 0) ? 12 : hour12hr;  // If 0, make it 12.

  niceDate += hour12hr +
      ((fromDate.getMinutes() === 0) ? '' : ':' + fromDate.getMinutes()) +
      (fromDate.getHours() >= 12 ? 'pm' : 'am');

  niceDate += ' &mdash; ';

  // If the event ends on the same day, then skip duplicating the date.
  if (!(fromDate.getFullYear() == toDate.getFullYear() &&
        fromDate.getMonth() == toDate.getMonth() &&
        fromDate.getDate() == toDate.getDate())) {
    niceDate += chrome.i18n.getMessage('month_' + (toDate.getMonth() + 1)) +
        ' ' + toDate.getDate();
  }

  // Finally, append the end time, skipping unnecessary ":00" as above.
  niceDate += (toDate.getHours() % 12) +
      ((toDate.getMinutes() === 0) ? '' : ':' + toDate.getMinutes()) +
      (toDate.getHours() >= 12 ? 'pm' : 'am');

  return niceDate;
};
