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
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * The icon needs to reflect whether or not the event we've detected is in
 * the current tag. Page actions do this correctly by default, but since
 * we're using a browser action, we need to keep track of the currently open
 * tab.
 */
var selectedTabId = 0;

/**
 * A list of events we have detected in the selected tab.
 */
var events = [];

/**
 * Chrome flattens our CalendarEvent object when passing from the content
 * script to the background page. Deserialize the object correctly before
 * storing it, so there's no ambiguity when accessing it.
 * @param {Object} events JSON object to deserialize.
 * @return {Array.<CalendarEvent>} The deserialized array of events created
 *     from the JSON Object.
 * @private
 */
function deserializeJsonEvents_(events) {
  var deserializedEvents = [];
  for (var i = 0; i < events.length; ++i) {
    var event = events[i];
    event.fields.start = CalendarUtils.fromIso8601(event.fields.start);
    if (event.fields.end) {
      event.fields.end = CalendarUtils.fromIso8601(event.fields.end);
    }
    deserializedEvents.push(event);
  }
  return deserializedEvents;
}

/**
 * Setup a listener for receiving requests from the content script.
 */
chrome.extension.onRequest.addListener(function onRequest(
    request, sender, sendResponse) {
  events['tab' + sender.tab.id] = deserializeJsonEvents_(request);
  selectedTabId = sender.tab.id;

  chrome.browserAction.setIcon({
    path: 'icons/calendar_add_19.png',
    tabId: sender.tab.id
  });

  sendResponse({});
});

/**
 * Listen to when user changes the tab, so we can show/hide the icon.
 */
chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
  selectedTabId = tabId;
});

/**
 * We need to reset the events detected in case the page was reloaded
 * in the same tab. Otherwise, even after the user clicks away
 * from the page that originally contained that event, we would
 * continue to show the green button and events list.
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') {
    delete events['tab' + tabId];
  }
});

