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
 * @fileoverview Script that runs in the context of the background page.
 * @author manas@google.com (Manas Tungare)
 */

/**
 * The namespace for background page related functionality.
 * @namespace
 */
var background = {};

/**
 * A static constant that decides whether debug messages get shown or not.
 * @type {boolean}
 * @private
 * @const
 */
background.DEBUG_ = false;

/**
 * The ID of the currently-selected tab. This is required because the same
 * browser action icon shows the status for multiple tabs, and must be updated
 * on every tab switch to indicate the events in that particular tab.
 * @type {number}
 */
background.selectedTabId = 0;

/**
 * A map of tab IDs to the list of events we have detected in that tab.
 * @type {Object.<string,Array.<Object>>}
 */
background.eventsFromPage = {};

/**
 * @typedef {{
 *   text: string,
 *   color: string,
 *   title: string
 * }}
 */
background.BadgeProperties;

/**
 * Initializes the background page by registering listeners.
 */
background.initialize = function() {
  background.listenForRequests_();
  background.listenForTabUpdates_();
  scheduler.start();
};

/**
 * A function that logs all its arguments if background.DEBUG_ is true.
 * @param {string} message The message to log.
 * @param {*=} opt_dump An optional set of parameters to show in the console.
 */
background.log = function(message, opt_dump) {
  if (background.DEBUG_) {
    if (opt_dump) {
      window.console.log(message, opt_dump);
    } else {
      window.console.log(message);
    }
  }
};

/**
 * Listens for incoming RPC calls from the browser action and content scripts
 * and takes the appropriate actions.
 * @private
 */
background.listenForRequests_ = function() {
  chrome.extension.onMessage.addListener(function(request, sender, opt_callback) {
    switch(request.method) {
      case 'events.detected.set':
        background.selectedTabId = sender.tab.id;
        background.eventsFromPage['tab' + background.selectedTabId] = request.parameters.events;
        chrome.browserAction.setIcon({
          path: 'icons/calendar_add_19.png',
          tabId: sender.tab.id
        });
        break;

      case 'events.detected.get':
        if (opt_callback) {
          opt_callback(background.eventsFromPage['tab' + background.selectedTabId]);
        }
        break;

      case 'events.feed.get':
        if (opt_callback) {
          opt_callback(feeds.events);
        }
        break;

      case 'events.feed.fetch':
        feeds.fetch();
        break;

      case 'options.changed':
        feeds.onFetched();
        break;
    }

    // Indicates to Chrome that a pending async request will eventually issue
    // the callback passed to this function.
    return true;
  });
};


/**
 * Listen to when user changes the tab, so we can show/hide the icon.
 * @private
 */
background.listenForTabUpdates_ = function() {
  chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
    background.selectedTabId = tabId;
  });

  // We need to reset the events detected in case the page was reloaded
  // in the same tab. Otherwise, even after the user clicks away
  // from the page that originally contained that event, we would
  // continue to show the orange button and events list.
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'loading') {
      delete background.eventsFromPage['tab' + tabId];
    }
  });
};


/**
 * Update specific properties of the badge.
 * @param {background.BadgeProperties} props The properties to update.
 */
background.updateBadge = function(props) {
  if ('text' in props) {
    chrome.browserAction.setBadgeText({'text': props.text});
  }
  if ('color' in props) {
    chrome.browserAction.setBadgeBackgroundColor({'color': props.color});
  }
  if ('title' in props) {
    chrome.browserAction.setTitle({'title': props.title});
  }
};


background.initialize();
