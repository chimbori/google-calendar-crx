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

/**
 * Some events don't have a duration that we can accurately determine.
 * So we default it to a certain length, and the user can tweak it before
 * adding.
 * @type {number}
 * @const
 */
var DEFAULT_DURATION_HOURS_IF_ABSENT = 2;

/**
 * Instead of reimplementing a small calendar view, we reuse the one
 * provided by the iGoogle calendar gadget. The URL to that is provided here.
 * @type {string}
 * @const
 */
var IGOOGLE_CALENDAR_URL =
   'https://www.google.com/calendar/ig?up_showDatepicker=0&up_hideAgenda=0';

/**
 * Add to Google Calendar button URL.
 * @type {string}
 * @const
 */
var ADD_TO_CALENDAR_BUTTON_URL =
    'http://www.google.com/calendar/images/ext/gc_button6.gif';

/**
 * Logs a message to the console, if present; else shows an alert.
 * @param {string} msg Message to log.
 */
function log(msg) {
  window.console ? window.console.log(msg) : alert(msg);
}


/**
 * If num is a single-digit number, return it prefixed with a single leading
 * zero; else return it as is.
 * @param {number} num One- or two-digit number.
 * @return {string} Two-character string representing the number, perhaps
 * with zero padding.
 */
function zeroPad(num) {
  return (num.toString().length == 1) ? '0' + num.toString() : num.toString();
}


/**
 * Return true iff the parameter passed is undefined or the blank string.
 * @param {string|Object|number|undefined} x Value to be checked.
 * @return {boolean} true iff the parameter is "" or undefined.
 */
function isBlankOrUndef(x) {
  return (typeof x == 'undefined') || (x.toString() == '');
}


/**
 * If a string is longer than numChars, then return a trimmed version of the
 * string with an ellipsis at the end. The returned string is guaranteed to be
 * numChars or fewer, so the actual string will be trimmed to numChars - 2 to
 * accommodate a space and the Unicode ellipsis (U+2026).
 * @param {string} str String to trim.
 * @param {number} numChars Maximum number of characters to return.
 * @return {string} Trimmed string.
 */
function trimTo(str, numChars) {
  if (str && str.length > numChars) {
    var op = str.substring(0, numChars - 2) + " \u2026";
    return op;
  }
  return str;
}


/**
 * In a DOMElement, locate the first instance of the given selector. If
 * such an instance is present, then return its text. Else return "".
 * @param {Element} element The DOMElement to start looking under.
 * @param {string} selector What to look for, as a CSS selector.
 * @return {string} The text of the first child if found; "" otherwise.
 */
function getFirstFieldText(element, selector) {
  var rawField = $(element).find(selector);
  if (rawField && rawField.length > 0) {
    return $(rawField[0]).text().trim();
  }
  return '';
}
