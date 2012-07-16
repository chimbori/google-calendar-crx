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
 * All events from visible calendars obtained during the last fetch.
 * @type {Array.<Object>}
 */
feeds.events = [];

/**
 * The event or events that will occur in the immediate future. If this contains
 * more than one event, then all those events must begin at the exact same time
 * and there should be no other event between now and the startTime of all of
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
  $.get(common.CALENDAR_LIST_FEED_URL, function(data) {
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

  $.get(feedUrl, (function(feed) {
    return function(data) {
      var events = [];
      $(data).find('entry').each(function() {
        var eventEntry = $(this);
        events.push({
          feed: feed,
          title: eventEntry.find('title').text(),
          startTime: utils.fromIso8601(eventEntry.find('when').attr('startTime')),
          endTime: utils.fromIso8601(eventEntry.find('when').attr('endTime')),
          description: eventEntry.find('content').text(),
          location: eventEntry.find('where').attr('valueString'),
          reminder: eventEntry.find('when').find('reminder').attr('minutes'),
          url: eventEntry.find('link[rel=alternate]').attr('href')
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

  feeds.getCalendars_(function(calendars) {
    // If no calendars are available, then either all are hidden, or the user
    // has not authenticated yet.
    if (calendars.length === 0) {
      callback && callback();
    }

    var allEvents = [];
    var pendingRequests = calendars.length;
    for (var i = 0; i < calendars.length; ++i) {
      feeds.getEventsFrom_(calendars[i], function(events) {
        // Merge events from all calendars into a single array.
        allEvents = allEvents.concat(events);
        if (--pendingRequests === 0) {
          allEvents.sort(function(first, second) {
            return first.startTime.getTime() - second.startTime.getTime();
          });
          feeds.events = allEvents;
          callback && callback();
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
  while (feeds.events[0].startTime < (new Date()).getTime()) {
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
    if (feeds.events[i].startTime.getTime() ==
        feeds.events[0].startTime.getTime()) {
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
    chrome.browserAction.setBadgeText({text: '?'});
    chrome.browserAction.setTitle({
      title: chrome.i18n.getMessage('authorization_required')
    });
    return;
  }

  var nextEvent = feeds.nextEvents[0];
  chrome.browserAction.setBadgeBackgroundColor({
    color: nextEvent.feed.color
  });
  chrome.browserAction.setBadgeText({
    text: utils.getTimeUntil(nextEvent.startTime)
  });
  chrome.browserAction.setTitle({
    title : feeds.getTooltipForEvents_(feeds.nextEvents)
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
    var startMoment = moment(nextEvents[0].startTime);
    tooltipLines.push(startMoment.calendar() + ' (' + startMoment.fromNow() + ')');
  }

  for (var i = 0; i < nextEvents.length; i++) {
    var event = nextEvents[i];
    tooltipLines.push(' • ' + event.title + ' (' + event.feed.title + ')');
  }
  return tooltipLines.join('\n');
};

