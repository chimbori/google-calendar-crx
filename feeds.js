// Copyright 2012 and onwards Google Inc.
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
 * @fileoverview Retrieves and parses a calendar feed from the server.
 * @author manas@google.com (Manas Tungare)
 */

/**
 * The Calendar Feed Parser namespace.
 * @namespace
 */
var feeds = {};

/**
 * URL of the feed that lists all calendars for the current user.
 * @type {string}
 * @const
 * @private
 */
feeds.CALENDAR_LIST_FEED_URL_ =
    'https://www.google.com/calendar/feeds/default/allcalendars/full';

/**
 * All events from visible calendars obtained during the last fetch.
 * @type {Array.<Object>}
 */
feeds.events = [];

/**
 * The event or events that will occur in the immediate future. If this contains
 * more than one event, then all those events must begin at the exact same time
 * and there should be no other event between now and the start time of all of
 * these events.
 * @type {Array.<Object>}
 */
feeds.nextEvents = [];

/**
 * The time at which fresh data was last fetched from the server.
 * @type {Date}
 */
feeds.lastFetchedAt = null;

/**
 * Sends a request to fetch the list of calendars for the currently-logged in
 * user.
 * @param {function(Array)} callback Gets called with objects representing
 *     calendar titles, urls, and colors.
 */
feeds.getCalendars_ = function(callback) {
  background.log('Fetching list of calendars.');

  $.get(feeds.CALENDAR_LIST_FEED_URL_, function(data) {
    var calendars = [];
    // See the raw feed to understand this parsing.
    $(data).find('entry').each(function() {
      var entry = $(this);

      var calendar = {
        title: entry.find('title').text(),
        url: entry.find('content').attr('src'),
        color: entry.find('color').attr('value')
      };

      // If a calendar is selected, and not hidden, add it to our list.
      if (entry.find('hidden').attr('value') == 'false' &&
          entry.find('selected').attr('value') == 'true') {
        calendars.push(calendar);
      }
    });
    callback(calendars);

  }).error(function(response) {
    if (response.status === 401) {
      callback([]);
    } else {
      window.console.log('An error was encountered in fetching the feed:',
          response);
    }
  });
};

/**
 * Retrieves events from a given calendar from the server.
 * @param {Object} feed A feed object: {title:'', url:'', color:''}.
 * @param {function(Array.<Object>)} callback A callback called when events
 *     are available.
 * @private
 */
feeds.getEventsFrom_ = function(feed, callback) {
  var feedUrl = feed.url + '?' + [
      'max-results=10',
      'futureevents=true',
      'orderby=starttime',
      'singleevents=true',
      'sortorder=ascending'].join('&');

  background.log('Fetching events from ' + feed.url);

  $.get(feedUrl, (function(feed) {
    return function(data) {
      background.log('Received events, now parsing.');

      var events = [];
      $(data).find('entry').each(function() {
        var eventEntry = $(this);

        // In case of recurring events, the entry has multiple <gd:when> fields.
        // One of them has only a startTime, and another has both a startTime and an endTime.
        // This is a workaround for this crazy behavior.
        var startTime, endTime;
        var when = eventEntry.find('when');
        for (var i = 0; i < when.length; i++) {
          if ($(when[i]).attr('startTime')) {
            startTime = $(when[i]).attr('startTime');
          }
          if ($(when[i]).attr('endTime')) {
            endTime = $(when[i]).attr('endTime');
          }
        }

        var start = utils.fromIso8601(startTime);
        var end = utils.fromIso8601(endTime);

        events.push({
          feed: feed,
          title: eventEntry.find('title').text(),
          start: start ? start.toDate() : null,
          end: end ? end.toDate() : null,
          description: eventEntry.find('content').text(),
          location: eventEntry.find('where').attr('valueString'),
          reminder: eventEntry.find('when').find('reminder').attr('minutes'),
          gcal_url: eventEntry.find('link[rel=alternate]').attr('href')
        });
      });

      callback(events);
    };
  })(feed));
};

/**
 * Sends a request to the server and retrieves a short list of events occurring
 * in the near future. This only fetches the events and sorts them, it does not
 * populate the global nextEvents list, or update the badge. Those actions are
 * to be performed in the callback.
 * @param {function()} callback A callback that gets called when the request
 *     is done.
 */
feeds.fetch = function(callback) {
  feeds.lastFetchedAt = new Date();

  background.updateBadge({
    'text': '\u2026',  // Ellipsis.
    'color': '#efefef',
    'title': chrome.i18n.getMessage('fetching_feed')
  });

  feeds.getCalendars_(function(calendars) {
    // If no calendars are available, then either all are hidden, or the user
    // has not authenticated yet.
    if (calendars.length === 0 && callback) {
      callback();
    }

    var allEvents = [];
    var pendingRequests = calendars.length;
    for (var i = 0; i < calendars.length; ++i) {
      feeds.getEventsFrom_(calendars[i], function(events) {
        // Merge events from all calendars into a single array.
        allEvents = allEvents.concat(events);
        if (--pendingRequests === 0) {
          allEvents.sort(function(first, second) {
            return first.start.getTime() - second.start.getTime();
          });
          feeds.events = allEvents;
          if (callback) {
            callback();
          }
        }
      });
    }
  });
};

/**
 * Removes events from the global feeds.events list that have already
 * occurred. Events that have started and in progress are deemed to be past,
 * and are removed as well.
 * @private
 */
feeds.removePastEvents_ = function() {
  // If the last fetch returned no events, it's an empty calendar, so bail out
  // right away. Never request a second fetch, else it will loop infinitely
  // and inundate the server.
  if (feeds.events.length === 0) {
    return;
  }

  // At this point, there are non-zero events present, so it's not a completely
  // empty calendar.
  while (feeds.events[0].start < (new Date()).getTime()) {
    feeds.events.splice(0, 1);  // Remove the first element of the array.
  }

  // If there are no more future events left, then fetch a few more & update
  // the badge.
  if (feeds.events.length === 0) {
    feeds.fetch(feeds.updateBadge);
  }
};

/**
 * Updates the global feeds.nextEvents list by determining the immediately next
 * event to occur from the global feeds.events list. If more than one event
 * starts at the same time, all of them are included.
 * @private
 */
feeds.determineNextEvents_ = function() {
  if (feeds.events.length === 0) {
    return;
  }

  feeds.nextEvents = [feeds.events[0]];
  for (var i = 1; i < feeds.events.length; i++) {
    if (feeds.events[i].start.getTime() ==
        feeds.events[0].start.getTime()) {
      feeds.nextEvents.push(feeds.events[i]);
    } else {
      break;
    }
  }
};

/**
 * Updates the 'minutes/hours/days until' visible badge from the events
 * obtained during the last fetch. Does not fetch new data.
 */
feeds.updateBadge = function() {
  feeds.removePastEvents_();
  feeds.determineNextEvents_();

  // If there are no more next events to show, bail out.
  if (feeds.nextEvents.length === 0) {
    background.updateBadge({
      'text': '?',
      'title': chrome.i18n.getMessage('authorization_required')
    });
    return;
  }

  var nextEvent = feeds.nextEvents[0];
  chrome.browserAction.setBadgeBackgroundColor({
    color: nextEvent.feed.color
  });

  // Use the Moment.js library to get a formatted string, but change the
  // templates temporarily to the strings that we want. Make sure we reset it
  // to 'en' afterwards.
  moment.relativeTime = {future : "%s", past : "%s",
      s: "1s", ss : "%ds",
      m: "1m", mm : "%dm",
      h: "1h", hh : "%dh",
      d: "1d", dd : "%dd",
      M: "1mo", MM : "%dmo",
      y: "1yr", yy : "%dy"};
  background.updateBadge({'text': moment(nextEvent.start).fromNow()});

  moment.lang('en');
  background.updateBadge({
    'title': feeds.getTooltipForEvents_(feeds.nextEvents)
  });
};

/**
 * Returns a formatted tooltip for the badge, given a set of events that all
 * occur at the same time.
 * @param {Array.<Object>} nextEvents A list of events.
 * @return {string} A formatted tooltip.
 * @private
 */
feeds.getTooltipForEvents_ = function(nextEvents) {
  var tooltipLines = [];
  if (nextEvents.length > 0) {
    var startMoment = moment(nextEvents[0].start);
    tooltipLines.push(startMoment.calendar() + ' (' + startMoment.fromNow() + ')');
  }

  for (var i = 0; i < nextEvents.length; i++) {
    var event = nextEvents[i];
    tooltipLines.push(' • ' + event.title + ' (' + event.feed.title + ')');
  }
  return tooltipLines.join('\n');
};

