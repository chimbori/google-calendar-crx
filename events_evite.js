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
 * @fileoverview Detects events from an Evite invitation page. Ideally,
 * they'd just use microformats, so we wouldn't need this hack.
 *
 * @author manas@google.com (Manas Tungare)
 */

var eviteEvents = detectEviteEvents();

if (eviteEvents.length > 0) {
  $($('.detailsName')[0]).next().prepend(
      Renderer.getInlineIconLarge(eviteEvents[0]));
  chrome.extension.sendRequest(eviteEvents, function(response) {});
}


function detectEviteEvents() {
  var events = [];
  var fields = {};

  fields.title = $('h1').text();
  fields.url = window.location.href;
  fields.description = $('.turnOffClip').html();


  $.each($('.detailsName').parent().parent().children(), function(i, row) {
    var fieldName = $(row).find('td.detailsName').text().toLowerCase().
        replace(/[^a-z0-9]/g, '');
    var fieldValue = $(row).find('td.details').text().trim();

    switch (fieldName) {
      case 'host':
        fields.host = fieldValue;
        break;

      case 'location':
        var locLines = $(row).find('td.details div').html().split('<br>');
        fields.location = locLines[0].trim();
        fields.address = [locLines[1].trim(), ' ', locLines[2].trim()].join('');
        break;

      case 'when':
        var parts = fieldValue.match(
            /[A-Za-z]*, ([A-Za-z]*) ([0-9]*), ([0-9]{1,2}:[0-9]{2}(AM|PM))/);
        var currentYear = (new Date()).getFullYear();
        var startDateTime = [
            parts[1], ' ',
            parts[2], ', ',
            currentYear, ', ',
            CalendarUtils.amPmTimeToIso8601(parts[3])].join('');

        fields.start = new Date(Date.parse(startDateTime));

        fields.end = new Date(Date.parse(startDateTime));
        fields.end.setHours(fields.start.getHours() +
            common.DEFAULT_DURATION_HOURS_IF_ABSENT);
        break;

      case 'phone':
        fields.phone = fieldValue;
        break;
    }
  });

  events.push(new CalendarEvent(fields));
  return events;
}
