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
 * @param {CalendarEvent} event The calendar event object.
 * @return {jQuery} The generated DOM element.
 * @private
 */
function getInlineIconSmall_(event) {
  return $('<a>').css({
        'float': 'right'
      }).attr({
        'href': event.gcal_url,
        'target': '_blank'
      }).append(
        $('<img>').attr({
          'src': chrome.extension.getURL('icons/calendar_add_19.png'),
          'alt': chrome.i18n.getMessage('add_to_google_calendar')
        })
      );
}

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
    var event = /** @type {CalendarEvent} */ ({});

    event.title = utils.getFirstFieldText(vevent, '.summary');
    event.description = utils.getFirstFieldText(vevent, '.description');

    var startDate = findDate(vevent, '.dtstart');
    if (startDate) {
      event.start = utils.fromIso8601(startDate).valueOf();
    }

    var endDate = findDate(vevent, '.dtend');
    if (endDate) {
      event.end = utils.fromIso8601(endDate).valueOf();
    }

    var urlElement = $(vevent).find('.url');
    if (urlElement && urlElement.attr('href')) {
      var hrefAttr = urlElement.attr('href').toString();
      if (hrefAttr.indexOf('http://') === 0 ||
          hrefAttr.indexOf('https://') === 0) {
        // Absolute URL with hostname.
        event.url = hrefAttr;
      } else if (hrefAttr.indexOf('/') === 0) {
        // Absolute URL without hostname.
        event.url = window.location.protocol + '//' +
            window.location.host + hrefAttr;
      } else {
        // Relative URL
        event.url = window.location.href + hrefAttr;
      }
    } else {
      event.url = window.location.href;
    }

    var adr = $(vevent).find('adr');
    var location = $(vevent).find('.location');
    if (adr.length) {
      event.location = adr.find('.locality').text().trim() + ' ' +
                       adr.find('.region').text().trim();
    } else if (location.length) {
      event.location = location.html().replace(/<[^>]*>/g, ' ').trim();
    }

    event = utils.processEvent(event);
    events.push(event);

    // Insert a button inline near the title of the page.
    $(vevent).find('.summary').prepend(getInlineIconSmall_(event));
  });

  return events;
}


var mfEvents = detectHCalendarEvents();
if (mfEvents.length > 0) {
  chrome.extension.sendMessage({
    method: 'events.detected.set',
    parameters: {
      events: mfEvents
    }
  });
}
