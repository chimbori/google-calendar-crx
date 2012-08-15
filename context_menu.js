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
 * @fileoverview Creates and handles context menus on web pages to let the user
 * add events by selecting & highlighting text.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * Namespace for context menu functionality.
 */
var menu = {};

/**
 * Adds a context menu to every page that lets the user select text and add
 * an event to calendar.
 * @private
 */
menu.installContextMenu_ = function() {
  chrome.contextMenus.create({
    'title': chrome.i18n.getMessage('add_to_google_calendar'),
    'contexts': ['selection', 'editable'],
    'onclick': menu.onClicked_
  });
};


/**
 * The click handler that gets called when a user selects text, then clicks
 * on our context menu.
 * @param {OnClickData} info The highlighted text, URL, etc.
 * @param {Tab} tab The current tab.
 * @private
 */
menu.onClicked_ = function(info, tab) {
  var event = /** @type {CalendarEvent} */ {};
  event.title = info.selectionText;
  event.url = tab.url;
  event.description = tab.title;
  event = utils.processEvent(event);
  chrome.tabs.create({'url': event.gcal_url});
};


/**
 * Initializes the context menu functionality.
 */
menu.initialize = function() {
  menu.installContextMenu_();
};


menu.initialize();
