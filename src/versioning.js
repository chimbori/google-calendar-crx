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
 * @fileoverview Performs any update actions when a new version is installed.
 * @author manas@google.com (Manas Tungare)
 */

/**
 * The namespace for versioning related functionality.
 * @namespace
 */
var versioning = {};

/**
 * Checks the current version versus the last-recorded version, and performs
 * any upgrade actions that might be needed.
 */
versioning.checkVersion = function() {
  var storedVersion = window.localStorage['version'];
  var currentVersion = chrome.app.getDetails().version;
  if (!storedVersion || currentVersion != storedVersion) {
    versioning.onVersionUpdated_(storedVersion, currentVersion);
    // Save new version.
    window.localStorage['version'] = chrome.app.getDetails().version;
  }
};

/**
 * Callback when a new version is detected. Based on the from- and to- versions,
 * any specific upgrade actions can be performed.
 * @param {string} fromVersion The last-installed version.
 * @param {string} toVersion The currently-installed version.
 * @private
 */
versioning.onVersionUpdated_ = function(fromVersion, toVersion) {
  versioning.showAnnouncement_();
};


/**
 * Shows an announcement message above the list of events. This is only shown
 * once, immediately after upgrading to a new version. The next time the browser
 * action popup is opened, the new version string has already been written to
 * persistent local storage, and this message does not get shown again.
 * @private
 */
versioning.showAnnouncement_ = function(message) {
  $('#announcement_new_features').css('display', 'inline-block');
};
