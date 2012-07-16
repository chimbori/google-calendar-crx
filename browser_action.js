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
 * When the popup is loaded, fetch the events in this tab from the
 * background page, set up the appropriate layout, etc.
 */
window.onload = function() {
  // Load internationalized messages.
  $('.i18n').each(function(i, el) {
    var j = $(el);
    // JSCompiler throws a warning about the next line about type. Ignore it.
    j.text(chrome.i18n.getMessage(j.attr('id').toString()));
  });

  $('[data-href="calendar_ui_url"]').attr('href', common.CALENDAR_UI_URL);

  // Load tab strip click handlers.
  $('#events_on_this_page').click(function() {
    $('.selected').removeClass('selected');
    $('.tab').hide();
    $('#events_on_this_page').addClass('selected');
    $('#events').show();
  });

  $('#show_calendar').click(function() {
    $('.selected').removeClass('selected');
    $('.tab').hide();
    $('#show_calendar').addClass('selected');
    $('#agenda').show();
  });

  chrome.browserAction.getBadgeText({}, function(text) {
    if (text == '?') {  // Not authorized.
      $('.tab-container').hide();
      $('#error').show();

      // If we're not authenticated, then it's fine to re-request the feed
      // upon explicit user interaction (i.e. opening the popup.)
      feeds.fetch(feeds.updateBadge);
    } else {
      $('.tab-container').show();
      $('#error').hide();
    }
  });

  // Load events.
  var background = chrome.extension.getBackgroundPage()['background'];
  var eventsOnPage = background.events['tab' + background.selectedTabId];

  // Pick a layout based on how many events we have to show: 0, 1, or >1.
  if (utils.isBlankOrUndef(eventsOnPage)) {
    $('.tabstrip').hide();
    $('#events_on_this_page').hide();
    $('#show_calendar').click();

  } else if (eventsOnPage.length == 1) {
    $('.tabstrip').show();
    $('#events_on_this_page').text(
        chrome.i18n.getMessage('events_on_this_page', ['1']));
    $('#events').append(browseraction.getSingleEventPopup(eventsOnPage[0]));
    $('#events_on_this_page').click();

  } else {  // We have more than one event on this page.
    $('.tabstrip').show();
    $('#events_on_this_page').text(
        chrome.i18n.getMessage('events_on_this_page',
            [eventsOnPage.length]));
    $('#events').append('<div id="eventsList"></div>');
    $.each(eventsOnPage, function(i, event) {
      $('#eventsList').append(Renderer.getEventButton(event, false));
    });
    $('#events_on_this_page').click();
  }

  // 'cal' is the name of the iframe in which the calendar loads.
  window.parent['cal'].location.replace(common.IGOOGLE_CALENDAR_URL);
};


/**
 * Create a popup for a single Calendar Event.
 * @param {CalendarEvent} event The calendar event model for this view.
 * @return {jQuery} Generated DOMElement.
 */
browseraction.getSingleEventPopup = function(event) {
  var popup = [
      '<div>',
      '<h1>', event.fields.title, '</h1>',
      '<p>',
      utils.getFormattedDatesFromTo(
          event.fields.start, event.fields.end),
      '</p>',
      '<p>', Renderer.getEventButton(event, true), '</p>'
  ].join('');

  if (!utils.isBlankOrUndef(event.fields.address)) {
    popup += [
        '<p><a target="_blank" href="http://maps.google.com/maps?q=',
        encodeURIComponent(event.fields.address),
        '"><img src="',
        'http://maps.google.com/maps/api/staticmap?center=',
        encodeURIComponent(event.fields.address),
        '&zoom=12&size=320x270&maptype=roadmap&sensor=false',
        '&markers=',
        encodeURIComponent(event.fields.address),
        '"/></a></p>'
        ].join('');
  }

  return $(popup);
};
