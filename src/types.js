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
 * @fileoverview Type definitions for the Closure compiler.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * An object that encapsulates a request from/to the background page to/from the
 * content script and/or the browser action.
 * @constructor
 */
function RequestObject() {}
/** @type {string} */
RequestObject.prototype.method = '';
/** @type {Object.<string>} */
RequestObject.prototype.parameters = {};
/** @type {function()} */
RequestObject.prototype.callback = function() {};


/**
 * A calendar feed object.
 * @constructor
 */
function CalendarFeed() {}
/** @type {string} */
CalendarFeed.prototype.title = '';
/** @type {string} */
CalendarFeed.prototype.url = '';
/** @type {string} */
CalendarFeed.prototype.color = '';


/**
 * A calendar event, either detected or from the feed.
 * @constructor
 */
function CalendarEvent() {}
/** @type {string} */
CalendarEvent.prototype.title = '';
/** @type {string} */
CalendarEvent.prototype.description = '';
/** @type {number} */
CalendarEvent.prototype.start = '';
/** @type {number} */
CalendarEvent.prototype.end = '';
/** @type {string} */
CalendarEvent.prototype.url = '';
/** @type {string} */
CalendarEvent.prototype.gcal_url = '';
/** @type {string} */
CalendarEvent.prototype.location = '';
/** @type {CalendarFeed} */
CalendarEvent.prototype.feed = new CalendarFeed();
