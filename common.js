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
 * @fileoverview Common utility functions shared across content scripts,
 * background page, and page actions.
 *
 * @author manas@google.com (Manas Tungare)
 */

var common = {};

/**
 * Some events don't have a duration that we can accurately determine.
 * So we default it to a certain length, and the user can tweak it before
 * adding.
 * @type {number}
 * @const
 */
common.DEFAULT_DURATION_HOURS_IF_ABSENT = 2;

/**
 * The URL of the browser UI for Google Calendar.
 * @type {string}
 * @const
 */
common.CALENDAR_UI_URL = 'https://www.google.com/calendar/';

/**
 * The template URL used to create a new calendar event.
 * @type {string}
 * @const
 */
common.CALENDAR_CREATE_EVENT_TPL =
    'https://www.google.com/calendar/event?action=TEMPLATE&trp=false&text=';

/**
 * URL of the feed that lists all calendars for the current user.
 * @type {string}
 * @const
 */
common.CALENDAR_LIST_FEED_URL =
    'https://www.google.com/calendar/feeds/default/allcalendars/full';

/**
 * Add to Google Calendar button URL.
 * @type {string}
 * @const
 */
common.ADD_TO_CALENDAR_BUTTON_URL =
    'https://www.google.com/calendar/images/ext/gc_button6.gif';
