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
 * @fileoverview Handles setting and getting options.
 *
 * @author manas@google.com (Manas Tungare)
 */

/**
 * Namespace for Options-related functionality.
 */
var options = {};

/**
 * A list of options that are configured via the Options page, and used
 * throughout the extension. The strings here are used as keys for the storage,
 * and must be unique application-wide.
 * @enum {string}
 * @const
 */
options.Options = {
  BADGE_TEXT_SHOWN: 'badge-text-shown',
  TIME_FORMAT_24H: 'time-format-24h'
};

/**
 * Defaults for all the options.
 * @type {Object}
 * @private
 */
options.DEFAULTS_ = {};
options.DEFAULTS_[options.Options.BADGE_TEXT_SHOWN] = true;

/**
 * All option names are prefixed with this when stored in local storage.
 * @type {string}
 * @const
 * @private
 */
options.OPTION_KEY_PREFIX_ = 'option:';

/**
 * A CSS expression to select UI widgets that directly map to options.
 * @type {string}
 * @const
 * @private
 */
options.OPTIONS_WIDGET_SELECTOR_ = '.option';

/**
 * Retrieves an option value from non-volatile storage.
 * @param {options.Options} optionKey The key of the option.
 * @return {?*} The retrieved value, as anything; null if not found.
 */
options.get = function(optionKey) {
  var optionValue = window.localStorage[options.OPTION_KEY_PREFIX_ + optionKey];
  if (optionValue) {
    return window.JSON.parse(optionValue);
  }
  return options.DEFAULTS_[optionKey];
};

/**
 * Saves an option value to non-volatile storage.
 * @param {options.Options} optionKey The key of the option.
 * @param {*} optionValue The value of the option.
 */
options.set = function(optionKey, optionValue) {
  window.localStorage[options.OPTION_KEY_PREFIX_ + optionKey] =
      window.JSON.stringify(optionValue);
  chrome.extension.sendMessage({method: 'options.changed'});
};

/**
 * Adds click handlers to UI controls such that clicking them will automatically
 * save their state to non-volatile storage.
 */
options.installAutoSaveHandlers = function() {
  var optionInputs = document.querySelectorAll(options.OPTIONS_WIDGET_SELECTOR_);
  for (var i = 0, option; option = optionInputs[i]; ++i) {
    var type = option.getAttribute('type');
    if (type == 'checkbox') {
      option.addEventListener('change', function(event) {
        var element = event.target;
        options.set(element.name, element.checked);
      }, false);
    } else {
      /** @this {Element} */
      var handler = function() {
        options.set(this.name, this.value);
      };
      option.addEventListener('change', handler, false);
      if (type == 'number' || type == 'range') {
        // Spinboxes and sliders don't generate onchange events until the input
        // is explicitly entered (e.g. via enter/tab keys). So listen for
        // "input" events, too.
        option.addEventListener('input', handler, false);
      }
    }

    // TODO(manas): Add more UI widget types here as needed.
  }
};

/**
 * Writes all default values to storage if they don't already exist.
 */
options.writeDefaultsToStorage = function() {
  for (var optionKey in options.DEFAULTS_) {
    optionKey = /** @type {options.Options} */ (optionKey);  // For JSCompiler.
    if (!window.localStorage[options.OPTION_KEY_PREFIX_ + optionKey]) {
      // If the option has not been saved, the type will be undefined. Even if
      // the value is a boolean false, it will be stored as the string "false",
      // so this check is safe to make.
      options.set(optionKey, options.get(optionKey));
    }
  }
};

/**
 * Sets the initial value of each option UI widget (checkbox, radio button,
 * etc.) to the state that is saved in non-volatile storage.
 */
options.loadOptionsUIFromSavedState = function() {
  var optionInputs = document.querySelectorAll(options.OPTIONS_WIDGET_SELECTOR_);
  for (var i = 0, option; option = optionInputs[i]; ++i) {
    var type = option.getAttribute('type');
    var name = option.getAttribute('name');
    var value = options.get(name);
    if (type == 'checkbox') {
      option.checked = value ? 'checked' : '';
    } else {
      if (value != null) {
        option.value = value;
      }
    }
  }
};


/**
 * Loads the list of calendars from storage into the Options page so users can
 * select individual calendars to show or hide.
 */
options.loadCalendarList = function() {
  chrome.extension.getBackgroundPage().background.log('options.loadCalendarList');

  chrome.storage.local.get('calendars', function(storage) {
    if (chrome.runtime.lastError) {
      background.log('Error retrieving settings:', chrome.runtime.lastError);
    }

    if (storage['calendars']) {
      var calendars = storage['calendars'];

      for (var calendarURL in calendars) {
        var calendar = calendars[calendarURL];
        var calendarListEntry = $('<label>');

        var darkColor = utils.darkenColor(calendar.color, 75);
        var gradient = '-webkit-linear-gradient(top, ' + darkColor + ' 0%,' + calendar.color + ' 100%)';

        $('<input>').attr({
          'type': 'checkbox',
          'name': calendar.url,
          'checked': calendar.visible
        }).addClass('calendar-checkbox').css({
          'background': gradient,
          'border': '1px solid ' + calendar.color
        }).on('change', function() {
          calendars[ $(this).attr('name') ].visible = $(this).is(':checked');
          chrome.storage.local.set({'calendars': calendars}, function() {
            if (chrome.runtime.lastError) {
              background.log('Error saving calendar list options.', chrome.runtime.lastError);
              return;
            }
            chrome.extension.sendMessage({method: 'events.feed.fetch'});
          });
        }).appendTo(calendarListEntry);

        $('<span>').text(' ' + calendar.title).appendTo(calendarListEntry);
        if (calendar.author != calendar.title) {
          $('<span>').addClass('secondary').text(' • ' + calendar.author)
              .appendTo(calendarListEntry);
        }

        calendarListEntry.appendTo($('#calendar-list'));
      }
    }
  });
};

/**
 * Retrieves internationalized messages and loads them into the UI.
 * @private
 */
options.fillMessages_ = function() {
  // Load internationalized messages.
  $('.i18n').each(function() {
    var i18nText = chrome.i18n.getMessage($(this).attr('data-msg').toString());
    if ($(this).prop('tagName') == 'IMG') {
      $(this).attr({'title': i18nText});
    } else {
      $(this).text(i18nText);
    }
  });

  $('#report-issue-button').on('click', function() {
    var systemInfo = [];
    systemInfo.push('What steps will reproduce the problem?\n1. \n2. \n3. \n');
    systemInfo.push('What is the expected result?\n\n');
    systemInfo.push('What happens instead?\n\n');
    systemInfo.push('System Information:');
    systemInfo.push('- Extension version: ' + chrome.app.getDetails().version);
    systemInfo.push('- window.navigator.language: ' + window.navigator.language);
    systemInfo.push('- window.navigator.userAgent: ' + window.navigator.userAgent);
    systemInfo.push('');
    $('#system-info').val(systemInfo.join('\n'));
    $('#report-issue-steps').slideDown(100);
  });
};


// Are we running in the context of the Options page? Or is this file being included so that
// the client can set and get options?
if ($('html').attr('data-context') == 'options-page') {
  options.fillMessages_();
  options.installAutoSaveHandlers();
  options.writeDefaultsToStorage();
  options.loadOptionsUIFromSavedState();
  options.loadCalendarList();
}
