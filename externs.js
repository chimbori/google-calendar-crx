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
 * @fileoverview Externs for libraries used by this extension.
 * @author manas@google.com (Manas Tungare)
 */


/** @return {Object} */
chrome.app.getDetails = function() {
  return {};
};


/**
 * @param {Date|number|string=} opt_date
 * @param {Array.<string>|string=} opt_formatString
 * return {Moment}
 */
function moment(opt_date, opt_formatString) {}

/**
 * @param {string} locale
 * @param {Object=} opt_languageStrings
 */
moment.lang = function(locale, opt_languageStrings) {};


/**
 * Externs for the Moment.js library.
 * @constructor
 */
function Moment() {}

/** @return {string} */
Moment.prototype.calendar = function() {};

/** @return {Moment} */
Moment.prototype.clone = function() {};

/**
 * @param {Moment|number} another
 * @param {string=} opt_unit
 * @param {boolean=} opt_float
 * @return {number}
 */
Moment.prototype.diff = function(another, opt_unit, opt_float) {};

/**
 * @param {string=} opt_formatString
 * @return {string}
 */
Moment.prototype.format = function(opt_formatString) {};

/** @return {string} */
Moment.prototype.fromNow = function() {};

/**
 * @param {number=} opt_hours
 * @return {number|Moment}
 */
Moment.prototype.hours = function(opt_hours) {};

/**
 * @param {number=} opt_minutes
 * @return {number|Moment}
 */
Moment.prototype.minutes = function(opt_minutes) {};

/**
 * @param {number=} opt_seconds
 * @return {number|Moment}
 */
Moment.prototype.seconds = function(opt_seconds) {};

/** @return {Date} */
Moment.prototype.toDate = function() {};

/** @return {number} */
Moment.prototype.valueOf = function() {};

/** @return {number} */
Moment.prototype.year = function() {};
