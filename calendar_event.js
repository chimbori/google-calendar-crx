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
 * @fileoverview Defines a CalendarEvent class.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * A single calendar event, with related methods to manipulate
 * its fields. Note that all fields are stored as a single object within the
 * CalendarEvent; there are no individual getters/setters. That would be too
 * heavyweight for what we need.
 * @param {Object} fields Fields in the calendar entry.
 * TODO(manas) Document fields more clearly.
 * @constructor
 */
function CalendarEvent(fields) {
  this.fields = fields;
  this.populateMissingFields_();
  this.trimAllFieldsToMaxChars_();
  this.fields.gcal_url = this.getGCalUrl_();
}


/**
 * Since all the information is to be sent via a GET request, we need to
 * limit each field to a certain number of characters.
 * @type {number}
 */
var MAX_CHARS_PER_FIELD = 500;


/**
 * Populate missing fields by inferring or calculating their values.
 * @private
 */
CalendarEvent.prototype.populateMissingFields_ = function() {
  if (common.isBlankOrUndef(this.fields.end)) {
    // If there's no end time, infer one as best as we can.
    this.fields.end = this.inferEndTime_(this.fields.start);
  }
};


/**
 * Trims all fields to have fewer than MAX_CHARS_PER_FIELD characters.
 * @private
 */
CalendarEvent.prototype.trimAllFieldsToMaxChars_ = function() {
  this.fields.title = common.trimTo(this.fields.title, MAX_CHARS_PER_FIELD);
  this.fields.description = common.trimTo(this.fields.description,
      MAX_CHARS_PER_FIELD);
  this.fields.location = common.trimTo(this.fields.location, MAX_CHARS_PER_FIELD);
};


/**
 * Returns a link to a template URL that prefills a Google Calendar event
 * template with the details of this event.
 * @return {string} Google Calendar event template link.
 * @private
 */
CalendarEvent.prototype.getGCalUrl_ = function() {
  // Basic event information: Title, Start, End.
  var link =
      common.CALENDAR_CREATE_EVENT_TPL +
      encodeURIComponent(this.fields.title);

  // Dates could be optional.
  if (!common.isBlankOrUndef(this.fields.start)) {
    link += '&dates=' + CalendarUtils.getDateGoogleCalendar(this.fields.start);

    // Even if start date is present, end date could be missing.
    if (!common.isBlankOrUndef(this.fields.end)) {
      link += '/' + CalendarUtils.getDateGoogleCalendar(this.fields.end);
    }
  }

  // Location
  link += '&location=' + this.getFormattedLocation_();

  // URL
  if (!common.isBlankOrUndef(this.fields.url)) {
    link += '&sprop=' + encodeURIComponent(this.fields.url) +
        '&sprop=name:' + encodeURIComponent(this.fields.title);
  }

  // Details
  link += '&details=';
  if (!common.isBlankOrUndef(this.fields.description)) {
    link += encodeURIComponent(this.fields.description + "\n\n");
  }
  link += chrome.i18n.getMessage('read_more_at_original_url') +
      encodeURIComponent(this.fields.url);

  return link;
};

/**
 * Infer the end time of this event based on heuristics. Not very robust,
 * but better than nothing.
 * @param {Date} startTime Start time for this event.
 * @return {Date} Inferred end time.
 * @private
 */
CalendarEvent.prototype.inferEndTime_ = function(startTime) {
  // Make a deep copy.
  var endTime = new Date(Date.parse(startTime.toString()));

  // Assume it's an all-day event if hh=0 & mm=0.
  if (startTime.getHours() === 0 && startTime.getMinutes() === 0) {
    endTime.setDate(startTime.getDate() + 1);
  } else {
    // It's not an all-day event, so default to start + X hours.
    endTime.setHours(startTime.getHours() + common.DEFAULT_DURATION_HOURS_IF_ABSENT);
  }
  return endTime;
};


/**
 * Format the location for this event, given any or all of local street address,
 * friendly location name, region, city, etc.
 * @return {string} Formatted location details.
 * @private
 */
CalendarEvent.prototype.getFormattedLocation_ = function() {
  var loc = '';
  if (!common.isBlankOrUndef(this.fields.address)) {
    // Do we have a well-formatted address?
    loc += encodeURIComponent(this.fields.address);

    // Do we have a descriptive location in addition to an address?
    if (!common.isBlankOrUndef(this.fields.location)) {
      loc += encodeURIComponent(' (' + this.fields.location + ')');
    }

  } else if (!common.isBlankOrUndef(this.fields.location)) {
    // We only have a descriptive location; no address.
    loc = encodeURIComponent(this.fields.location);
  }

  return loc;
};
