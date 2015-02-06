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
 * An in-memory log that stores the last N records.
 * @type {Array.<string>}
 * @private
 */
background.logs_ = [];

/**
 * Colors used for the badge, other than calendar colors.
 * @enum {string}
 * @const
 */
background.BADGE_COLORS = {
  ERROR: '#f00',
  IN_PROGRESS: '#efefef'
};

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
 *   text: (string|undefined),
 *   color: (string|undefined),
 *   title: (string|undefined)
 * }}
 */
background.BadgeProperties;

/**
 * A function that logs all its arguments to memory and to the console if the
 * user has enabled logging.
 * @param {string} message The message to log.
 * @param {*=} opt_dump An optional set of parameters to show in the console.
 */
background.log = function(message, opt_dump) {
  if (options.get(options.Options.DEBUG_ENABLE_LOGS)) {
    var timestampedMessage = '[' + moment().toISOString() + '] ' + message;
    if (opt_dump) {
      background.logs_.push(timestampedMessage + ' ' + JSON.stringify(opt_dump, null /* replacer */, '  '));
      window.console.log(timestampedMessage, opt_dump);
    } else {  // Otherwise the log shows a spurious string "undefined" for every opt_dump.
      background.logs_.push(timestampedMessage);
      window.console.log(timestampedMessage);
    }
  }
};
/**
 * Initializes the background page by registering listeners.
 */
background.initialize = function() {
  utils.startAnalytics_();
  background.initMomentJs_();
  background.setupMenus_();
  background.listenForRequests_();
  background.listenForTabUpdates_();
  scheduler.start();
};

/**
 * Initializes Moment.js with a new 'language' for the badge text. It only has
 * strings for relative dates, such as 1h, 2m, 3d. It is used as the language
 * for a single local instance (not changed globally) when required to render
 * the badge text. This method creates the language and installs it for later
 * use elsewhere.
 * @private
 */
background.initMomentJs_ = function() {
  moment.lang('relative-formatter', {
    relativeTime: {
      future : "%s", past : "%s",
      s: "1s", ss : "%ds",
      m: "1m", mm : "%dm",
      h: "1h", hh : "%dh",
      d: "1d", dd : "%dd",
      M: "1mo", MM : "%dmo",
      y: "1yr", yy : "%dy"
    }
  });
};

background.setupMenus_ = function() {
  chrome.contextMenus.create({
    id: constants.MENU_ITEM_VIEW_CALENDAR_WEB,
    title: chrome.i18n.getMessage('view_web_calendar'),
    contexts: ['browser_action']
  });

  chrome.contextMenus.onClicked.addListener(function(menu) {
    if (menu.menuItemId == constants.MENU_ITEM_VIEW_CALENDAR_WEB) {
      chrome.tabs.create({'url': constants.CALENDAR_UI_URL});
    }
  });
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
          path: {
            "19": 'icons/calendar_add_19.png',
            "38": 'icons/calendar_add_38.png'
          },
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
        feeds.fetchCalendars();
        break;

      case 'options.changed':
        feeds.refreshUI();
        break;

      case 'authtoken.update':
        feeds.requestInteractiveAuthToken();
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
