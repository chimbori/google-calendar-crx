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
 * @fileoverview Script that runs in the context of the browser action popup.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * Namespace for browser action functionality.
 */
var browseraction = {};

/**
 * The URL of the browser UI for Google Calendar.
 * @type {string}
 * @const
 */
browseraction.CALENDAR_UI_URL_ = 'https://www.google.com/calendar/';


/**
 * Initializes UI elements in the browser action popup.
 */
browseraction.initialize = function() {
  browseraction.fillMessages_();
  browseraction.installTabStripClickHandlers_();
  browseraction.installButtonClickHandlers_();
  browseraction.showLoginMessageIfNotAuthenticated_();
  browseraction.showDetectedEvents_();
  chrome.extension.sendMessage({method: 'events.feed.get'},
      browseraction.showEventsFromFeed_);
};


/**
 * Fills i18n versions of messages from the Chrome API into DOM objects.
 * @private
 */
browseraction.fillMessages_ = function() {
  // Load internationalized messages.
  $('.i18n').each(function() {
    var i18nText = chrome.i18n.getMessage($(this).attr('id').toString());
    if ($(this).prop('tagName') == 'IMG') {
      $(this).attr({'title': i18nText});
    } else {
      $(this).text(i18nText);
    }
  });

  $('[data-href="calendar_ui_url"]').attr('href', browseraction.CALENDAR_UI_URL_);
  $('#event-title').attr({'placeholder': chrome.i18n.getMessage('event_title_placeholder')});
};


/**
 * Makes the tab strip clickable, and sets it up to switch tabs on clicking.
 * @private
 */
browseraction.installTabStripClickHandlers_ = function() {
  $('#add-events').click(function() {
    $('.selected').removeClass('selected');
    $('.tab').hide();
    $('#add-events').addClass('selected');
    $('#events').show();
  });

  $('#view_agenda').click(function() {
    $('.selected').removeClass('selected');
    $('.tab').hide();
    $('#view_agenda').addClass('selected');
    $('#agenda').show();
  }).click();  // Execute the handler that was just assigned.
};


/**
 * Adds click handlers to buttons and clickable objects.
 * @private
 */
browseraction.installButtonClickHandlers_ = function() {
  $('#sync_now').on('click', function() {
    chrome.extension.sendMessage({method: 'events.feed.fetch'},
        browseraction.showEventsFromFeed_);
  });

  $('#manual-add-details').hide();
  $('#event-title').on('mousedown', function() {
    $(this).attr('rows', 3);
    $('#manual-add-details').slideDown(100);
  });

  // If the user sets the from-date, and the to-date happens to be before the
  // new from-date, then update the to-date to be the same as the from-date.
  $('#from-date').on('change', function() {
    var fromDate = $('#from-date').val().toString();
    var toDate = $('#to-date').val().toString();
    if (fromDate !== '' && toDate !== '') {
      fromDate = moment(fromDate, "YYYY-MM-DD");
      toDate = moment(toDate, "YYYY-MM-DD");
      if (toDate.diff(fromDate) < 0) {
        $('#to-date').val($('#from-date').val().toString());
      }
    }
  });

  $('#add_button').on('click', function() {
    var formats = [
      'YYYY-MM-DD hh:mma',
      'YYYY-MM-DD hh:mm',
      'YYYY-MM-DD hha',
      'YYYY-MM-DD hh'
    ];

    var event = /** @type {CalendarEvent} */ {};
    event.title = event.description = $('#event-title').val().toString();
    event.start = moment($('#from-date').val() + ' ' + $('#from-time').val(), formats).toDate();
    event.end = moment($('#to-date').val() + ' ' + $('#to-time').val(), formats).toDate();
    event = utils.processEvent(event);

    chrome.tabs.create({'url': event.gcal_url});
  });

  // Initialize both from- and to- dates to today.
  $('#from-date').val(moment().format('YYYY-MM-DD'));
  $('#to-date').val(moment().format('YYYY-MM-DD'));
};


/**
 * Checks if we're logged in (by using the badge icon text as a proxy) and
 * either shows or hides a message asking the user to login.
 * @private
 */
browseraction.showLoginMessageIfNotAuthenticated_ = function() {
  // Check if we're authenticated or not, and display either the "Login Now"
  // message, or show the tab strip.
  chrome.browserAction.getBadgeText({}, function(text) {
    if (text == '?') {  // Not authorized.
      $('#error').show();

      // If we're not authenticated, then it's fine to re-request the feed
      // upon explicit user interaction (i.e. opening the popup.)
      chrome.extension.sendMessage({method: 'events.feed.fetch'},
          browseraction.showEventsFromFeed_);
    } else {
      $('#error').hide();
    }
  });
};


/**
 * Shows events detected on the current page (by one of the parsers) in a list
 * inside the browser action popup.
 * @private
 */
browseraction.showDetectedEvents_ = function() {
  chrome.extension.sendMessage({method: 'events.detected.get'}, function(eventsFromPage) {
    // Pick a layout based on how many events we have to show: 0, 1, or >1.
    if (eventsFromPage && eventsFromPage.length > 0) {
      $('<div>').addClass('date-header')
          .text('Events from this page')
          .appendTo($('#events-list'));
      $.each(eventsFromPage, function(i, event) {
        browseraction.createEventDiv_(event).appendTo($('#events-list'));
      });
      $('#add-events').click();
    }
  });
};


/**
 * Retrieves events from the calendar feed, sorted by start time, and displays
 * them in the browser action popup.
 * @param {Array} events The events to display.
 * @private
 */
browseraction.showEventsFromFeed_ = function(events) {
  for (var i = 0; i < events.length; i++) {
    var event = events[i];

    var start = utils.fromIso8601(event.start);
    var end = utils.fromIso8601(event.end);
    var allDay = !end ||
        (start.hours() === 0 && start.minutes() === 0 &&
        end.hours() === 0 && end.minutes() === 0);

    // Insert a date header if the date of this event is not the same as that of the
    // previous event.
    var lastDateHeader;
    var startDate = start.clone().hours(0).minutes(0).seconds(0);
    if (!lastDateHeader || startDate.diff(lastDateHeader, 'hours') > 23) {
      lastDateHeader = startDate;
      $('<div>').addClass('date-header')
          .text(lastDateHeader.format('dddd MMMM, D'))
          .appendTo($('#agenda'));
    }

    browseraction.createEventDiv_(event).appendTo($('#agenda'));
  }
};


/**
 * Creates a <div> that renders a detected event or a fetched event.
 * @param {CalendarEvent} event The calendar event.
 * @return {jQuery} The rendered 'Add to Calendar' button.
 * @private
 */
browseraction.createEventDiv_ = function(event) {
  var start = utils.fromIso8601(event.start);
  var end = utils.fromIso8601(event.end);
  var now = new Date();

  var eventDiv = $('<div>')
      .addClass('event')
      .attr({'data-url': event.gcal_url});

  eventDiv.on('click', function() {
    chrome.tabs.create({'url': $(this).attr('data-url')});
  });

  var isNewEvent = !event.feed;
  var isHappeningNow = start.valueOf() < now.getTime() && end.valueOf() >= now.getTime();
  if (isNewEvent) {  // This event has not yet been added to the user's calendar.
    $('<div>').addClass('feed-color')
        .css({'background-color': '#e6932e'})
        .text('+')
        .appendTo(eventDiv);
  } else {  // This event is already on the user's calendar.
    $('<div>').addClass('feed-color')
        .css({'background-color': event.feed.color})
        .attr({'title': event.feed.title})
        .text(isHappeningNow ? '!' : '')
        .appendTo(eventDiv);
  }

  var eventDetails = $('<div>').addClass('event-details').appendTo(eventDiv);

  $('<h1>').text(event.title).appendTo(eventDetails);

  var allDay = !end ||
      (start.hours() === 0 && start.minutes() === 0 &&
      end.hours() === 0 && end.minutes() === 0);

  // Pick a time format based on whether the event is an all-day event, and/or
  // if it's an event we've detected (versus an event from the feed.)
  var timeFormat = allDay ?
      (isNewEvent ? 'MMM D, YYYY' : '') :
      (isNewEvent ? 'MMM D, YYYY h:mma' : 'h:mma');

  // If it's an all-day event from the feed, we don't need to include any time
  // information, because it will already be rendered under the appropriate
  // date header. So, skip this section entirely if timeFormat is ''.
  if (timeFormat !== '') {
    $('<div>').addClass('start-and-end-times')
        .append($('<span>').addClass('start').text(start.format(timeFormat)))
        .append(' – ')
        .append($('<span>').addClass('end').text(end.format(timeFormat)))
        .appendTo(eventDetails);
  }

  if (event.location) {
    $('<div>').addClass('location').text(event.location).appendTo(eventDetails);
  }

  return eventDiv;
};


/**
 * When the popup is loaded, fetch the events in this tab from the
 * background page, set up the appropriate layout, etc.
 */
window.addEventListener('load', function() {
  browseraction.initialize();
}, false);
