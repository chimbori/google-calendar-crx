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
 * The maximum number of characters per field, to keep the resulting Google
 * Calendar template URL below acceptable limits.
 * @type {number}
 * @const
 * @private
 */
utils.MAX_CHARS_PER_FIELD_ = 300;


/**
 * Processes a calendar event object by inferring missing fields,
 * trimming lengths of fields that are too long, and adding computed fields.
 * @param {CalendarEvent} event The event to process.
 * @return {CalendarEvent} The processed event.
 */
utils.processEvent = function(event) {
  if (!event.end) {  // If there's no end time, infer one as best as we can.
    var startMoment = moment(event.start);
    if (startMoment.hours() === 0 && startMoment.minutes() === 0) {
      // Assume it's an all-day event if hh=0 & mm=0.
      event.end = startMoment.add('d', 1).valueOf();
    } else {
      // It's not an all-day event, so default to start + X hours, and the user
      // can tweak it before adding to their calendar.
      event.end = startMoment.add('h', 2).valueOf();
    }
  }

  // Trim each field to a maximum acceptable length.
  for (var field in event) {
    if (event.hasOwnProperty(field) &&
        event[field].length > utils.MAX_CHARS_PER_FIELD_) {
      event[field] = event[field].replace(/[\s]+/gi, ' ').
          substring(0, utils.MAX_CHARS_PER_FIELD_ - 2) + ' \u2026';
    }
  }

  if (event.address) {
    if (event.location) {
      event.location = event.address + ' (' + event.location + ')';
    } else {
      event.location = event.address;
    }
    delete event.address;
  }

  // Create Calendar URL after all fields have been trimmed.
  event.gcal_url = utils.getGCalUrl_(event);

  return event;
};


/**
 * Returns a link to a template URL that prefills a Google Calendar event
 * template with the details of this event.
 * @param {CalendarEvent} event The event to create the URL for.
 * @return {string} Google Calendar event template link.
 * @private
 */
utils.getGCalUrl_ = function(event) {
  // Basic event information: Title, Start, End.
  var link =
      'https://www.google.com/calendar/event?action=TEMPLATE&trp=false&ctext=' +
      encodeURIComponent(event.title);

  // Dates could be optional.
  if (event.start) {
    // If the time is exactly midnight, this might be an all-day event, so skip
    // the T000000 part.
    link += '&dates=' +
        moment(event.start).format('YYYYMMDDTHHmmss').replace('T000000', '');

    // Even if start date is present, end date could be missing.
    if (event.end) {
      link += '/' +
          moment(event.end).format('YYYYMMDDTHHmmss').replace('T000000', '');
    }
  }

  // Location
  if (event.location) {
    link += '&location=' + encodeURIComponent(event.location);
  }

  // URL
  if (event.url) {
    link += '&sprop=' + encodeURIComponent(event.url) +
        '&sprop=name:' + encodeURIComponent(event.title);
  }

  // Details
  if (event.description || event.url) {
    link += '&details=';

    if (event.description) {
      link += encodeURIComponent(event.description + '\n\n');
    }

    if (event.url) {
      link += chrome.i18n.getMessage('read_more_at_original_url') +
          encodeURIComponent(event.url);
    }
  }

  return link;
};


/**
 * Parse ISO 8601 date/time into a JavaScript date.
 * ** This function adapted from GData's JavaScript Date/time parser. **
 * @param {string|jQuery} s ISO 8601 date as a string.
 * @return {Moment} Parsed JavaScript date object.
 */
utils.fromIso8601 = function(date) {
  if (!date) {
    return null;
  }

  if (typeof date === 'string') {
    date = date.replace('Z', '+00:00');
    return moment(date, [
      'YYYY-MM-DDTHH:mm:ssZZ', 'YYYY-MM-DDTHHmmssZZ', 'YYYYMMDDTHHmmssZZ',
      'YYYY-MM-DDTHH:mm:ss',   'YYYY-MM-DDTHHmmss',   'YYYYMMDDTHHmmss',
      'YYYY-MM-DDTHH:mmZZ',    'YYYY-MM-DDTHHmmZZ',   'YYYYMMDDTHHmmZZ',
      'YYYY-MM-DDTHH:mm',      'YYYY-MM-DDTHHmm',     'YYYYMMDDTHHmm',
      'YYYY-MM-DDTHH',                                'YYYYMMDDTHH',
      'YYYY-MM-DD',                                   'YYYYMMDD'
    ]);
  } else {
    return moment(date);
  }
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

