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
 * @fileoverview Detects events from any page that contains hEvent
 * microformats.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * Return HTML for an inline "Add to Calendar" button in small size.
 * @param {CalendarEvent} event The calendar event model for this view.
 * @return {string} Generated HTML.
 * @private
 */
function getInlineIconSmall_(event) {
  return [
      '<a style="float: right;" href="',
      event.fields.gcal_url,
      '" target="_blank"><img src="',
      chrome.extension.getURL('icons/calendar_add_19.png'),
      '" alt="',
      chrome.i18n.getMessage('add_to_google_calendar'),
      '"/></a>'
      ].join('');
};

/**
 * Locate a start or end date given the parent node and an attribute.
 * @param {Element} vevent Top-level vevent element.
 * @param {string} cssAttribute Either '.dtstart' or '.dtend'.
 * @return {string} Date located, or null if none found.
 */
function findDate(vevent, cssAttribute) {
  // Spec says: attr 'title' of class 'dtstart' or 'dtend'.
  var dtstartend = $(vevent).find(cssAttribute);
  if (dtstartend) {
    if (dtstartend.attr('title')) {
      return dtstartend.attr('title').toString();

    } else if (dtstartend.children().length) {
      // http://lakefieldmusic.com/tour-dates-concerts-shows-live-performances
      // <span class="dtstart">
      //   August 14, 2010 <span class="value-title"
      //   title="2010-08-14T15:00:00-0700"></span>
      // </span>
      var children = dtstartend.children();
      for (var i = 0; i < children.length; ++i) {
        var child = children[i];
        if ($(child).attr('title')) {
          return $(child).attr('title').toString();
        }
      }

    } else if (dtstartend.text()) {
      return dtstartend.text().toString();
    }
  }

  var published = $(vevent).find('.published');
  if (published) {
    if (published.attr('title')) {
      return published.attr('title').toString();
    } else if (published.text()) {
      return published.text().toString();
    }
  }
}

function detectHCalendarEvents() {
  var events = [];

  $.each($('.vevent'), function(i, vevent) {
    var fields = {};

    fields.title = utils.getFirstFieldText(vevent, '.summary');
    fields.description = utils.getFirstFieldText(vevent, '.description');

    fields.start = new Date(Date.parse(
        utils.fromIso8601(findDate(vevent, '.dtstart'))));

    var endDate = findDate(vevent, '.dtend');
    if (endDate) {
      fields.end = new Date(Date.parse(utils.fromIso8601(endDate)));
    }

    var urlElement = $(vevent).find('.url');
    if (urlElement && urlElement.attr('href')) {
      var hrefAttr = urlElement.attr('href');
      if (hrefAttr.indexOf('http://') === 0 ||
          hrefAttr.indexOf('https://') === 0) {
        // Absolute URL with hostname.
        fields.url = hrefAttr;
      } else if (hrefAttr.indexOf('/') === 0) {
        // Absolute URL without hostname.
        fields.url = window.location.protocol + '//' +
            window.location.host + hrefAttr;
      } else {
        // Relative URL
        fields.url = window.location.href + hrefAttr;
      }
    } else {
      fields.url = window.location.href;
    }

    var maybeAdr = $(vevent).find('adr');
    if (maybeAdr != null) {
      fields.citytown = maybeAdr.find('.locality').text().trim() + ' ' +
          maybeAdr.find('.region').text().trim();
    } else {
      fields.citytown = vevent.find('.location').html()
          .replace(/<[^>]*>/g, ' ').trim();
    }

    var calendarEvent = new CalendarEvent(fields);
    events.push(calendarEvent);

    // Insert a button inline near the title of the page.
    $(vevent).find('.summary').prepend(getInlineIconSmall_(calendarEvent));
  });

  return events;
}



var mfEvents = detectHCalendarEvents();
if (mfEvents.length > 0) {
  chrome.extension.sendMessage(mfEvents, function(response) {});
}
