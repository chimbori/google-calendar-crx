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

/* globals constants, utils */

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
 * @type {string}
 * @const
 * @private
 */
browseraction.QUICK_ADD_API_URL_ =
    'https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/quickAdd';

/**
 * Milliseconds to wait before fading out the alert shown when the user adds
 * a new event.
 */
browseraction.TOAST_FADE_OUT_DURATION_MS = 5000;

/**
 * Milliseconds to wait before rendering calendar entries.
 * The delay is needed to work aroud a Chrome extension popup layout bug
 * (https://crbug.com/428044). The value was picked via trial-and-error;
 * 100ms was the least amount that made the issue go away (on Chrome 64
 * and macOS Sierra). See also:
 * https://github.com/manastungare/google-calendar-crx/issues/224
 */
browseraction.SHOW_EVENTS_DELAY_MS = 100;

/**
 * Key code for `Esc`
 */
browseraction.KEY_CODE_ESCAPE = 27;

/**
 * Key code for `Enter - CR`
 */
browseraction.KEY_CODE_CR = 13;

/**
 * Key code for `Enter - LF`
 */
browseraction.KEY_CODE_LF = 10;

/**
 * Char `a`, keyboard shortcut key for quick add box
 */
browseraction.SHORTCUT_OPEN_QUICK_ADD = 'a';


/**
 * Initializes UI elements in the browser action popup.
 */
browseraction.initialize = function() {
  chrome.extension.getBackgroundPage().background.log('browseraction.initialize()');
  browseraction.fillMessages_();
  browseraction.installButtonClickHandlers_();
  browseraction.installKeydownHandlers_();
  browseraction.showLoginMessageIfNotAuthenticated_();
  browseraction.loadCalendarsIntoQuickAdd_();
  browseraction.listenForRequests_();
  chrome.extension.sendMessage({method: 'events.feed.get'}, browseraction.showEventsFromFeed_);
};


/**
 * Fills i18n versions of messages from the Chrome API into DOM objects.
 * @private
 */
browseraction.fillMessages_ = function() {
  // Initialize language for Moment.js.
  moment.lang('en');
  moment.lang(window.navigator.language);
  if (moment.lang() != window.navigator.language) {
    moment.lang(window.navigator.language.substring(0, 2));
  }

  // Load internationalized messages.
  $('.i18n').each(function() {
    var i18nText = chrome.i18n.getMessage($(this).attr('id').toString());
    if (!i18nText) {
      chrome.extension.getBackgroundPage().background.log(
          'Error getting string for: ', $(this).attr('id').toString());
      return;
    }

    if ($(this).prop('tagName') == 'IMG') {
      $(this).attr({'title': i18nText});
    } else {
      $(this).text(i18nText);
    }
  });

  $('[data-href="calendar_ui_url"]').attr('href', constants.CALENDAR_UI_URL);
  $('#quick-add-event-title').attr({
    'placeholder': chrome.i18n.getMessage('event_title_placeholder')
  });
};


/** @private */
browseraction.loadCalendarsIntoQuickAdd_ = function() {
  chrome.extension.getBackgroundPage().background.log('browseraction.loadCalendarsIntoQuickAdd_()');
  chrome.storage.local.get(constants.CALENDARS_STORAGE_KEY, function(storage) {
    if (chrome.runtime.lastError) {
      chrome.extension.getBackgroundPage().background.log(
          'Error retrieving calendars:', chrome.runtime.lastError);
    }

    if (storage[constants.CALENDARS_STORAGE_KEY]) {
      var calendars = storage[constants.CALENDARS_STORAGE_KEY];
      var dropDown = $('#quick-add-calendar-list');
      for (var calendarId in calendars) {
        var calendar = calendars[calendarId];
        if (calendar.editable && calendar.visible) {
          dropDown.append($('<option>', {value: calendar.id, text: calendar.title}));
        }
      }
    }
  });
};


/** @private */
browseraction.installButtonClickHandlers_ = function() {
  $('#authorization_required').on('click', function() {
    $('#authorization_required').text(chrome.i18n.getMessage('authorization_in_progress'));
    chrome.extension.sendMessage({method: 'authtoken.update'});
  });

  $('#show_quick_add').on('click', function() {
    browseraction.toggleQuickAddBoxVisibility_(!$('#quick-add').is(':visible'));
  });

  $('#sync_now').on('click', function() {
    chrome.extension.sendMessage({method: 'events.feed.fetch'}, browseraction.showEventsFromFeed_);
  });

  $('#show_options').on('click', function() {
    chrome.tabs.create({'url': 'options.html'});
  });

  $('#quick_add_button').on('click', function() {
    browseraction.addNewEventIntoCalendar_();
  });
};


/** @private */
browseraction.installKeydownHandlers_ = function() {
  // Add new event to calendar on pressing `Ctrl + Enter`
  $('#quick-add-event-title').on('keydown', function(e) {
    // Check for Windows and Mac keyboards for event on Ctrl + Enter
    if ((e.ctrlKey || e.metaKey) &&
        (e.keyCode == browseraction.KEY_CODE_CR || e.keyCode == browseraction.KEY_CODE_LF) &&
        $('#quick-add-event-title').val() !== '') {
      // Ctrl-Enter pressed
      browseraction.addNewEventIntoCalendar_();
    }

    // Close quick add box, if empty, on `Esc`
    if (e.keyCode == browseraction.KEY_CODE_ESCAPE) {
      // Prevent popup from closing if quick-add-box is open and has unsaved input
      e.stopPropagation();
      e.preventDefault();

      // Close quick add box if empty
      if ($('#quick-add-event-title').val() === '') {
        browseraction.toggleQuickAddBoxVisibility_(false);
      }
    }
  });

  // Open quick-add-box on pressing `a`
  $(document).on('keypress', function(e) {
    // Do nothing if in an input element
    if ($(e.target).is('input, textarea, select')) {
      return;
    }

    // Open quick add form on `a`
    if (e.key.toLowerCase() === browseraction.SHORTCUT_OPEN_QUICK_ADD) {
      e.stopPropagation();
      e.preventDefault();
      browseraction.toggleQuickAddBoxVisibility_(true);
    }
  });
};


/** @private */
browseraction.toggleQuickAddBoxVisibility_ = function(shouldShow) {
  if (shouldShow) {
    $('#show_quick_add').addClass('rotated');
    $('#quick-add').slideDown(200);
    $('#quick-add-event-title').focus();
  } else {
    $('#show_quick_add').removeClass('rotated');
    $('#quick-add').slideUp(200);
    $('#quick-add-event-title').blur();
  }
};

/**
 * Allow user to add a new event into their calendar.
 * @private
 */
browseraction.addNewEventIntoCalendar_ = function() {
  browseraction.createQuickAddEvent_(
      $('#quick-add-event-title').val().toString(), $('#quick-add-calendar-list').val());
  $('#quick-add-event-title').val('');  // Remove the existing text from the field.
};

/**
 * Checks if we're logged in and either shows or hides a message asking
 * the user to login.
 * @private
 */
browseraction.showLoginMessageIfNotAuthenticated_ = function() {
  chrome.identity.getAuthToken({'interactive': false}, function(authToken) {
    if (chrome.runtime.lastError || !authToken) {
      chrome.extension.getBackgroundPage().background.log(
          'getAuthToken', chrome.runtime.lastError.message);
      browseraction.stopSpinnerRightNow();
      $('#error').show();
      $('#action-bar').hide();
      $('#calendar-events').hide();
    } else {
      $('#error').hide();
      $('#action-bar').show();
      $('#calendar-events').show();
    }
  });
};


/**
 * Listens for incoming requests from other pages of this extension and calls
 * the appropriate (local) functions.
 * @private
 */
browseraction.listenForRequests_ = function() {
  chrome.extension.onMessage.addListener(function(request, sender, opt_callback) {
    switch (request.method) {
      case 'ui.refresh':
        chrome.extension.sendMessage(
            {method: 'events.feed.get'}, browseraction.showEventsFromFeed_);
        break;

      case 'sync-icon.spinning.start':
        browseraction.startSpinner();
        break;

      case 'sync-icon.spinning.stop':
        browseraction.stopSpinner();
        break;
    }
  });
};


browseraction.startSpinner = function() {
  $('#sync_now').addClass('spinning');
};

browseraction.stopSpinner = function() {
  $('#sync_now').one('animationiteration webkitAnimationIteration', function() {
    $(this).removeClass('spinning');
  });
};

browseraction.stopSpinnerRightNow = function() {
  $('#sync_now').removeClass('spinning');
};

function showToast(parent, summary, linkUrl) {
  var toastDiv = $('<div>').addClass('alert-new-event event').attr('data-url', linkUrl);
  var toastDetails = $('<div>').addClass('event-details');
  var toastText = $('<div>')
                      .addClass('event-title')
                      .css('white-space', 'normal')
                      .text(chrome.i18n.getMessage('alert_new_event_added') + summary);

  toastDetails.append(toastText);
  toastDiv.append(toastDetails);

  $('.fab').fadeOut();
  parent.prepend(toastDiv).fadeIn();

  $('.alert-new-event').on('click', function() {
    chrome.tabs.create({'url': $(this).attr('data-url')});
  });

  return setTimeout(function() {
    $('.alert-new-event').fadeOut();
    $('.fab').fadeIn();
  }, browseraction.TOAST_FADE_OUT_DURATION_MS);
}

/** @private */
browseraction.createQuickAddEvent_ = function(text, calendarId) {
  var quickAddUrl =
      browseraction.QUICK_ADD_API_URL_.replace('{calendarId}', encodeURIComponent(calendarId)) +
      '?text=' + encodeURIComponent(text);
  chrome.identity.getAuthToken({'interactive': false}, function(authToken) {
    if (chrome.runtime.lastError || !authToken) {
      chrome.extension.getBackgroundPage().background.log(
          'getAuthToken', chrome.runtime.lastError.message);
      return;
    }

    browseraction.startSpinner();
    $.ajax(quickAddUrl, {
      type: 'POST',
      headers: {'Authorization': 'Bearer ' + authToken},
      success: function(response) {
        showToast($('section'), response.summary, response.htmlLink);
        browseraction.stopSpinner();
        chrome.extension.sendMessage({method: 'events.feed.fetch'});
      },
      error: function(response) {
        browseraction.stopSpinner();
        $('#info_bar').text(chrome.i18n.getMessage('error_saving_new_event')).slideDown();
        window.setTimeout(function() {
          $('#info_bar').slideUp();
        }, constants.INFO_BAR_DISMISS_TIMEOUT_MS);
        chrome.extension.getBackgroundPage().background.log(
            'Error adding Quick Add event', response.statusText);
        if (response.status === 401) {
          chrome.identity.removeCachedAuthToken({'token': authToken}, function() {});
        }
      }
    });
    $('#quick-add').slideUp(200);
    $('#show_quick_add').toggleClass('rotated');
  });
};


/**
 * Retrieves events from the calendar feed, sorted by start time, and displays
 * them in the browser action popup.
 * @param {Array} events The events to display.
 * @private
 */
browseraction.showEventsFromFeed_ = function(events) {
  chrome.extension.getBackgroundPage().background.log('browseraction.showEventsFromFeed_()');
  $('#calendar-events').empty();

  chrome.identity.getAuthToken({'interactive': false}, function(authToken) {
    if (chrome.runtime.lastError || !authToken) {
      chrome.extension.getBackgroundPage().background.log(
          'getAuthToken', chrome.runtime.lastError.message);
      $('#error').show();
      $('#action-bar').hide();
      $('#calendar-events').hide();
    } else {
      $('#error').hide();
      $('#action-bar').show();
      $('#calendar-events').show();
    }
  });

  var calendarEventsDiv = $('<div>', {id: 'calendar-events'});

  // Insert a date header for Today as the first item in the list. Any ongoing
  // multi-day events (i.e., started last week, ends next week) will be shown
  // under today's date header, not under the date it started.
  var headerDate = moment().hours(0).minutes(0).seconds(0).millisecond(0);

  // Insert a new div for every day, that contains all events of a single day (necessary for
  // 'position: sticky')
  var calendarDay =
      $('<div>')
          .addClass('calendar-day')
          .append($('<div>')
                      .addClass('date-header')
                      .text(headerDate.format(chrome.i18n.getMessage('date_format_date_header'))))
          .appendTo(calendarEventsDiv);

  // If there are no events today, then avoid showing an empty date section.
  if (events === null || events.length === 0 ||
      moment(events[0].start).diff(headerDate, 'hours') > 23) {
    $('<div>')
        .addClass('no-events-today')
        .append(chrome.i18n.getMessage('no_events_today'))
        .appendTo(calendarDay);
  }

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var start = utils.fromIso8601(event.start);
    var end = utils.fromIso8601(event.end);

    // Insert a new date header if the date of this event is not the same as
    // that of the previous event.
    var startDate = start.clone().hours(0).minutes(0).seconds(0);
    if (startDate.diff(headerDate, 'hours') > 23) {
      headerDate = startDate;
      calendarDay =
          $('<div>')
              .addClass('calendar-day')
              .append(
                  $('<div>')
                      .addClass('date-header')
                      .text(headerDate.format(chrome.i18n.getMessage('date_format_date_header'))))
              .appendTo(calendarEventsDiv);
    }
    browseraction.createEventDiv_(event).appendTo(calendarDay);
  }

  // Add delay to work around Chrome extension popup layout bug
  // (https://github.com/manastungare/google-calendar-crx/issues/224)
  setTimeout(function() {
    $('#calendar-events').replaceWith(calendarEventsDiv);
  }, browseraction.SHOW_EVENTS_DELAY_MS);
};


/**
 * Creates a <div> that renders a detected event or a fetched event.
 * @param {CalendarEvent} event The calendar event.
 * @return {!jQuery} The rendered 'Add to Calendar' button.
 * @private
 */
browseraction.createEventDiv_ = function(event) {
  var start = utils.fromIso8601(event.start);
  var end = utils.fromIso8601(event.end);
  var now = moment().valueOf();

  var eventDiv =
      /** @type {jQuery} */ ($('<div>').addClass('event').attr({'data-url': event.gcal_url}));

  if (!start) {  // Some events detected via microformats are malformed.
    return eventDiv;
  }

  var isHappeningNow = start.valueOf() < now && end.valueOf() >= now;
  var spansMultipleDays = (end.diff(start, 'seconds') > 86400);
  // Not an all-day event implies that times are given.
  var isMultiDayEventWithTime = (!event.allday && spansMultipleDays);
  // Multi-day events with time should look like all-day events.
  if (event.allday || isMultiDayEventWithTime) {
    eventDiv.addClass('all-day');
  }
  eventDiv
      .on('click',
          function() {
            browseraction.goToCalendar_($(this).attr('data-url'));
          })
      .on('click', 'a', function(event) {
        // Clicks on anchor tags shouldn't propagate to eventDiv handler.
        event.stopPropagation();
      });

  var timeFormat =
      chrome.extension.getBackgroundPage().options.get('format24HourTime') ? 'HH:mm' : 'h:mma';

  var dateTimeFormat;
  if (event.allday) {  // Choose the correct time format.
    dateTimeFormat = chrome.i18n.getMessage('date_format_event_allday');
  } else if (isMultiDayEventWithTime) {
    dateTimeFormat = chrome.i18n.getMessage('date_format_event_allday') + ' ' + timeFormat;
  } else {
    dateTimeFormat = timeFormat;
  }

  var startTimeDiv = $('<div>').addClass('start-time');
  startTimeDiv.css({'background-color': event.feed.backgroundColor}).attr({
    'title': event.feed.title  // Show calendar name on mouseover
  });

  if (!event.allday && !spansMultipleDays) {
    // Start and end times for partial-day events.
    startTimeDiv.text(start.format(dateTimeFormat) + ' ' + end.format(dateTimeFormat));
  }
  startTimeDiv.appendTo(eventDiv);

  var eventDetails = $('<div>').addClass('event-details').appendTo(eventDiv);

  if (event.hangout_url) {
    $('<a>')
        .attr({'href': event.hangout_url, 'target': '_blank'})
        .append($('<img>').addClass('video-call-icon').attr({
          'src': chrome.extension.getURL('icons/ic_action_video.png')
        }))
        .appendTo(eventDetails);
  }

  if (event.attachments) {
    // If there are multiple attachments, do nothing. This ideally would have
    // a nice UI, but we can do without one because multiple attachments are
    // the exception rather than the norm.
    $('<a>')
        .attr({'href': event.attachments[0].fileUrl, 'target': '_blank'})
        .append($('<img>').addClass('attachment-icon').attr({'src': event.attachments[0].iconLink}))
        .appendTo(eventDetails);
  }

  var eventTitle = $('<div>').addClass('event-title').text(event.title);
  if (event.responseStatus == constants.EVENT_STATUS_DECLINED) {
    eventTitle.addClass('declined');
  }
  eventTitle.appendTo(eventDetails);

  if (event.location) {
    var url = event.location.match(/^https?:\/\//) ?
        event.location :
        'https://maps.google.com?q=' + encodeURIComponent(event.location);
    $('<a>')
        .attr({'href': url, 'target': '_blank'})
        .append($('<span>').text(event.location))
        .addClass('event-location')
        .append($('<img>').addClass('location-icon').attr({
          'src': chrome.extension.getURL('icons/ic_action_place.png')
        }))
        .appendTo(eventDetails);
  }

  if (spansMultipleDays || isMultiDayEventWithTime) {
    // If an event spans over multiple days,
    // show start and end dates and if given, show also times.
    $('<div>')
        .addClass('start-and-end-times')
        .append(start.format(dateTimeFormat) + ' — ' + end.format(dateTimeFormat))
        .appendTo(eventDetails);
  }
  return eventDiv;
};

/**
 * Search for a Google Calendar tab and re-use that one. If none exists, then
 * create a new tab.
 * @private
 */
browseraction.goToCalendar_ = function(eventUrl) {
  chrome.tabs.query(
      {
        // All URLs showing Calendar UI Home Screen, except '/eventedit/',
        // so current edits of events are not discarded.
        url: [
          constants.CALENDAR_UI_URL + '*/day*', constants.CALENDAR_UI_URL + '*/week*',
          constants.CALENDAR_UI_URL + '*/month*', constants.CALENDAR_UI_URL + '*/year*',
          constants.CALENDAR_UI_URL + '*/agenda*', constants.CALENDAR_UI_URL + '*/custom*'
        ],
        currentWindow: true  // Only search in current window.
      },
      function(tabs) {
        // If one or more tabs match these conditions,
        // select the first one of them and open the event URL.
        if (tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, {selected: true, url: eventUrl});
        } else {
          // No matches, create a new tab.
          chrome.tabs.create({url: eventUrl});
        }
      });
  return;
};

/**
 * When the popup is loaded, fetch the events in this tab from the
 * background page, set up the appropriate layout, etc.
 */
window.addEventListener('load', function() {
  browseraction.initialize();
}, false);
