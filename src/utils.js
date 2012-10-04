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
      event.end = startMoment.add('d', 1).format();
    } else {
      // It's not an all-day event, so default to start + X hours, and the user
      // can tweak it before adding to their calendar.
      event.end = startMoment.add('h', 2).format();
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
utils.fromIso8601 = function(s) {
  if (!s) {
    return null;
  }

  s = s.replace('Z', '+00:00');
  return moment(s, [
    'YYYY-MM-DDTHH:mm:ssZZ', 'YYYY-MM-DDTHHmmssZZ', 'YYYYMMDDTHHmmssZZ',
    'YYYY-MM-DDTHH:mm:ss',   'YYYY-MM-DDTHHmmss',   'YYYYMMDDTHHmmss',
    'YYYY-MM-DDTHH:mmZZ',    'YYYY-MM-DDTHHmmZZ',   'YYYYMMDDTHHmmZZ',
    'YYYY-MM-DDTHH:mm',      'YYYY-MM-DDTHHmm',     'YYYYMMDDTHHmm',
    'YYYY-MM-DDTHH',                                'YYYYMMDDTHH',
    'YYYY-MM-DD',                                   'YYYYMMDD'
  ]);
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
 * Adapted from:
 * http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color
 * @param {string} color A hex color (e.g. '#ff0000').
 * @param {number} amount How much to lighten or darken the color by.
 * @return {string} The lightened or darkened color.
 */
utils.darkenColor = function(color, amount) {
  color = color.substring(1);  // Remove the '#'.
  var num = parseInt(color, 16);
  var r = (num >> 16) + amount;
  var b = ((num >> 8) & 0x00FF) + amount;
  var g = (num & 0x0000FF) + amount;

  var rStr = (r.toString(16).length < 2) ? '0' + r.toString(16) : r.toString(16);
  var gStr = (g.toString(16).length < 2) ? '0' + g.toString(16) : g.toString(16);
  var bStr = (b.toString(16).length < 2) ? '0' + b.toString(16) : b.toString(16);

  var newColor = g | (b << 8) | (r << 16);
  newColor = newColor.toString(16);
  if (newColor.length == 5) {
    newColor = '0' + newColor;
  }
  return '#' + newColor;
};
