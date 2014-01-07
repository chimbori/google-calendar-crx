// Copyright 2013 Google Inc. All Rights Reserved.
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
  grunt.loadNpmTasks('grunt-closure-compiler');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-css');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  var closure_options = {
    compilation_level: "ADVANCED_OPTIMIZATIONS",
    debug: true,
    externs: [
      process.env.CLOSURE_PATH + '/contrib/externs/jquery-1.7.js',
      process.env.CLOSURE_PATH + '/contrib/externs/chrome_extensions.js',
      'externs.js'
    ],
    jscomp_error: [
      "accessControls",
      "ambiguousFunctionDecl",
      "checkTypes",
      "checkVars",
      "externsValidation",
      "globalThis",
      "internetExplorerChecks",
      "invalidCasts",
      "missingProperties",
      "nonStandardJsDocs",
      "strictModuleDepCheck",
      "unknownDefines",
      "uselessCode",
      "visibility"
    ],
    warning_level: "verbose"
  };

  var browser_action_files = [
    'src/types.js',
    'src/utils.js',
    'src/versioning.js',
    'src/browser_action.js'
  ];

  var background_page_files = [
    'src/types.js',
    'src/utils.js',
    'src/feeds.js',
    'src/options.js',
    'src/scheduler.js',
    'src/context_menu.js',
    'src/background.js'
  ];

  var content_script_files = [
    'src/types.js',
    'src/utils.js',
    'src/events_microformats.js'
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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
        chrome: true,
        moment: true
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

    jshint: {
      background_page: 'bin/background_page.concat.js',
      browser_action: 'bin/browser_action.concat.js',
      content_script: 'bin/content_script.concat.js'
    },

    'closure-compiler': {
      background_page: {
        js: '<%= concat.background_page.dest %>',
        jsOutputFile: 'bin/background_page.compiled.js',
        options: closure_options
      },
      browser_action: {
        js: '<%= concat.browser_action.dest %>',
        jsOutputFile: 'bin/browser_action.compiled.js',
        options: closure_options
      },
      content_script: {
        js: '<%= concat.content_script.dest %>',
        jsOutputFile: 'bin/content_script.compiled.js',
        options: closure_options
      }
    },

    csslint: {
      all: {
        src: [
          '*.css'
        ],
        rules: {
          'box-model': false,
          'box-sizing': false,
          'compatible-vendor-prefixes': false,
          'fallback-colors': false,
          'gradients': false,
          'ids': false,
          'qualified-headings': false,
          'universal-selector': false,
          'vendor-prefix': false,
        }
      }
    }
  });

  grunt.registerTask('default', [
    'concat:*',
    'jshint:*',
    'csslint:*',
    'closure-compiler:*'
  ]);
};
