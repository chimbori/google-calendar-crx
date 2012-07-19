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
  browseraction.fillMessages_();
  browseraction.installTabStripClickHandlers_();
  browseraction.showLoginMessageIfNotAuthenticated_();
  browseraction.showDetectedEvents_();
};


/**
 * Fills i18n versions of messages from the Chrome API into DOM objects.
 * @private
 */
browseraction.fillMessages_ = function() {
  // Load internationalized messages.
  $('.i18n').each(function() {
    $(this).text(chrome.i18n.getMessage($(this).attr('id').toString()));
  });

  $('[data-href="calendar_ui_url"]').attr('href', common.CALENDAR_UI_URL);
};


/**
 * Makes the tab strip clickable, and sets it up to switch tabs on clicking.
 * @private
 */
browseraction.installTabStripClickHandlers_ = function() {
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
};


/**
 * Shows events detected on the current page (by one of the parsers) in a list
 * inside the browser action popup.
 * @private
 */
browseraction.showDetectedEvents_ = function() {
  var background = chrome.extension.getBackgroundPage()['background'];
  var eventsOnPage = background.events['tab' + background.selectedTabId];

  // Pick a layout based on how many events we have to show: 0, 1, or >1.
  if (!eventsOnPage) {
    $('.tabstrip').hide();
    $('#events_on_this_page').hide();
    $('#show_calendar').click();

  } else if (eventsOnPage.length == 1) {
    $('.tabstrip').show();
    $('#events_on_this_page').text(
        chrome.i18n.getMessage('events_on_this_page', ['1']));
    $('#events').append(browseraction.createEventPreview_(eventsOnPage[0]));
    $('#events_on_this_page').click();

  } else {  // We have more than one event on this page.
    $('.tabstrip').show();
    $('#events_on_this_page').text(
        chrome.i18n.getMessage('events_on_this_page',
            [eventsOnPage.length]));
    $('#events').append('<div id="eventsList"></div>');
    $.each(eventsOnPage, function(i, event) {
      $('#eventsList').append(browseraction.createEventButton_(event, false));
    });
    $('#events_on_this_page').click();
  }
}


/**
 * Creates a widget-sized preview for a single extracted event.
 * @param {CalendarEvent} event The calendar event model for this view.
 * @return {jQuery} Generated DOMElement.
 * @private
 */
browseraction.createEventPreview_ = function(event) {
  var popup = [
      '<div>',
      '<h1>', event.fields.title, '</h1>',
      '<p>',
      utils.getFormattedDatesFromTo(
          event.fields.start, event.fields.end),
      '</p>',
      '<p>', browseraction.createEventButton_(event, true), '</p>'
  ].join('');

  if (event.fields.address) {
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


/**
 * Returns HTML for a button for a single event, which when clicked, will
 * add that event to the user's Google Calendar.
 * @param {CalendarEvent} event The calendar event.
 * @param {boolean} opt_UseDefaultAnchorText True to ignore event title and use
 *     standard anchor text instead. Used in single event mode.
 * @return {string} HTML for the 'Add to Calendar' button.
 * @private
 */
browseraction.createEventButton_ = function(event, opt_UseDefaultAnchorText) {
  opt_UseDefaultAnchorText = opt_UseDefaultAnchorText || false;
  return [
      '<a class="singleEvent" href="',
      event.fields.gcal_url,
      '" title="',
      chrome.i18n.getMessage('add_to_google_calendar'),
      '" target="_blank">',
      opt_UseDefaultAnchorText ?
          chrome.i18n.getMessage('add_to_google_calendar') :
          event.fields.title,
      '</a>'].join('');
};
