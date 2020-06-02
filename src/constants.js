/**
 * Copyright 2010 and onwards Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Namespace for constants.
 */
var constants = {};

/**
 * The URL of the browser UI for Google Calendar.
 * @type {string}
 * @const
 */
constants.CALENDAR_UI_URL = 'https://calendar.google.com/calendar/';

/**
 * A string used by the Calendar API to indicate when a user has declined attending an event.
 * @type {string}
 * @const
 */
constants.EVENT_STATUS_DECLINED = 'declined';

/**
 * @type {number}
 * @const
 */
constants.INFO_BAR_DISMISS_TIMEOUT_MS = 5000;

/**
 * The key under which the calendar list is stored in storage.
 * @type {string}
 * @const
 */
constants.CALENDARS_STORAGE_KEY = 'calendars';
