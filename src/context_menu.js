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
/* globals utils, options*/

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
 * A list of context menu IDs so they can be toggled on/off from options page
 * @enum {string}
 * @const
 */
menu.MenuIDs = {
  CONTEXT_MENU_ADD_TO_CALENDAR_: 'add_to_google_calendar'
};


/**
 * Adds a context menu to every page that lets the user select text and add
 * an event to calendar.
 * @private
 */
menu.installContextMenu_ = function() {
  chrome.contextMenus.create({
    'id': menu.MenuIDs.CONTEXT_MENU_ADD_TO_CALENDAR_,
    'title': chrome.i18n.getMessage('add_to_google_calendar'),
    'contexts': ['selection', 'editable'],
    'onclick': menu.onClicked_
  });
};


/**
 * Removes the context menu from all pages
 * @param {enum} menuID Identifier for menu to be removed
 * @private
 */
menu.removeContextMenu_ = function(menuID) {
  chrome.contextMenus.remove(menuID);
};


/**
 * Update the context menu - add or remove based on changes in user settings
 */
menu.updateContextMenus = function() {
  if (options.get(options.Options.ADD_FROM_CONTEXT_MENU_SHOWN)) {
    menu.installContextMenu_();
  } else {
    menu.removeContextMenu_(menu.MenuIDs.CONTEXT_MENU_ADD_TO_CALENDAR_);
  }
};


/**
 * The click handler that gets called when a user selects text, then clicks
 * on our context menu.
 * @param {OnClickData} info The highlighted text, URL, etc.
 * @param {Tab} tab The current tab.
 * @private
 */
menu.onClicked_ = function(info, tab) {
  _gaq.push(['_trackEvent', 'Context Menu', 'Shown']);
  var event = /** @type {CalendarEvent} */ ({});
  event.title = info.selectionText;
  event.url = tab.url;
  event.description = tab.title;
  event = utils.processEvent(event);
  chrome.tabs.create({'url': event.gcal_url});
};


/**
 * Sets up the context menu functionality.
 */
menu.initialize = function(menuIDs) {
  if (options.get(options.Options.ADD_FROM_CONTEXT_MENU_SHOWN)) {
    menu.installContextMenu_();
  }
};


menu.initialize();
