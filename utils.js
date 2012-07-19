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
 * @fileoverview Calendar-related utils, all under the utils namespace.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * The namespace for calendar-related utils.
 * @namespace
 */
var utils = {};


/**
 * Parse ISO 8601 date/time into a JavaScript date.
 * ** This function adapted from GData's JavaScript Date/time parser. **
 * @param {string|jQuery} s ISO 8601 date as a string.
 * @return {Date} Parsed JavaScript date object.
 */
utils.fromIso8601 = function(s) {
  if (!s) {
    return null;
  }

  s = s.replace('Z', '+00:00');
  return moment(s, [
    "YYYY-MM-DDTHH:mm:ssZZ", "YYYY-MM-DDTHHmmssZZ", "YYYYMMDDTHHmmssZZ",
    "YYYY-MM-DDTHH:mm:ss",   "YYYY-MM-DDTHHmmss",   "YYYYMMDDTHHmmss",
    "YYYY-MM-DDTHH:mmZZ",    "YYYY-MM-DDTHHmmZZ",   "YYYYMMDDTHHmmZZ",
    "YYYY-MM-DDTHH:mm",      "YYYY-MM-DDTHHmm",     "YYYYMMDDTHHmm",
    "YYYY-MM-DDTHH",                                "YYYYMMDDTHH",
    "YYYY-MM-DD",                                   "YYYYMMDD"
  ]).toDate();
};


/**
 * Display a time duration, taking into account the from, to, and current date.
 * @param {Date} fromDate A JavaScript date.
 * @param {Date} toDate A JavaScript date.
 * @return {string} A human-readable date.
 */
utils.getFormattedDatesFromTo = function(fromDate, toDate) {
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


/**
 * If a string is longer than numChars, then return a trimmed version of the
 * string with an ellipsis at the end. The returned string is guaranteed to be
 * numChars or fewer, so the actual string will be trimmed to numChars - 2 to
 * accommodate a space and the Unicode ellipsis (U+2026).
 * @param {string} str String to trim.
 * @param {number} numChars Maximum number of characters to return.
 * @return {string} Trimmed string.
 */
utils.trimTo = function(str, numChars) {
  if (str && str.length > numChars) {
    var op = str.substring(0, numChars - 2) + " \u2026";
    return op;
  }
  return str;
};


/**
 * In a DOMElement, locate the first instance of the given selector. If
 * such an instance is present, then return its text. Else return "".
 * @param {Element} element The DOMElement to start looking under.
 * @param {string} selector What to look for, as a CSS selector.
 * @return {string} The text of the first child if found; "" otherwise.
 */
utils.getFirstFieldText = function(element, selector) {
  var rawField = $(element).find(selector);
  if (rawField && rawField.length > 0) {
    return $(rawField[0]).text().trim();
  }
  return '';
};


/**
 * Return HTML for an inline "Add to Calendar" button in large size.
 * @param {CalendarEvent} event The calendar event model for this view.
 * @return {string} Generated HTML.
 */
utils.getInlineIconLarge = function(event) {
  return [
      '<a style="float: right;" href="',
      event.fields.gcal_url,
      '" title="',
      chrome.i18n.getMessage('add_to_google_calendar'),
      '" target="_blank"><img src="',
      common.ADD_TO_CALENDAR_BUTTON_URL,
      '"/></a>'
      ].join('');
};

