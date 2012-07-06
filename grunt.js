// Copyright 2012 Google Inc. All Rights Reserved.
// Author: manas@google.com (Manas Tungare)

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


module.exports = function(grunt) {
  // TODO(manas): USE process.env.NODE_PATH instead.
  grunt.loadNpmTasks('/usr/local/lib/node_modules/grunt-closure-compiler');
  grunt.loadNpmTasks('/usr/local/lib/node_modules/grunt-css');

  var browser_action_files = [
    'common.js',
    'calendar_utils.js',
    'renderer.js',
    'browser_action.js'
  ];

  var background_page_files = [
    'common.js',
    'calendar_utils.js',
    'background.js'
  ];

  var content_script_files = [
    'common.js',
    'calendar_utils.js',
    'calendar_event.js',
    'renderer.js',
    'events_microformats.js'
  ];

  grunt.initConfig({
    jshint: {
      options: {
        boss: true,
        browser: true,
        curly: true,
        devel: true,
        eqeqeq: false,
        eqnull: true,
        es5: true,
        evil: true,
        globalstrict: true,
        immed: true,
        jquery: true,
        latedef: true,
        newcap: true,
        noarg: true,
        node: true,
        noempty: true,
        nonew: true,
        strict: false,
        sub: true,
        trailing: true,
        undef: true
      },
      globals: {
        $: true,
        chrome: true
      }
    },

    concat: {
      background_page: {
        src: background_page_files,
        dest: 'bin/background_page.concat.js'
      },
      browser_action: {
        src: browser_action_files,
        dest: 'bin/browser_action.concat.js'
      },
      content_script: {
        src: content_script_files,
        dest: 'bin/content_script.concat.js'
      }
    },

    min: {
      background_page: {
        src: '<config:concat.background_page.dest>',
        dest: 'bin/background_page.min.js',
      },
      browser_action: {
        src: '<config:concat.browser_action.dest>',
        dest: 'bin/browser_action.min.js',
      },
      content_script: {
        src: '<config:concat.content_script.dest>',
        dest: 'bin/content_script.min.js',
      }
    },

    lint: {
      background_page: 'bin/background_page.concat.js',
      browser_action: 'bin/browser_action.concat.js',
      content_script: 'bin/content_script.concat.js'
    },

    'closure-compiler': {
      background_page: {
        js: background_page_files,
        jsOutputFile: 'bin/background_page.compiled.js'
      },
      browser_action: {
        js: browser_action_files,
        jsOutputFile: 'bin/browser_action.compiled.js'
      },
      content_script: {
        js: content_script_files,
        jsOutputFile: 'bin/content_script.compiled.js'
      }
    },
    
    csslint: {
      all: {
        src: [
          '*.css'
        ],
        rules: {
          'gradients': false,
          'ids': false,
          'qualified-headings': false,
          'universal-selector': false,
          'vendor-prefix': false,
        }
      }
    }
  });

  grunt.registerTask('default', 'concat lint min closure-compiler csslint');
};
