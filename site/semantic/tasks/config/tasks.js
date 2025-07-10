/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var
  console = require('better-console'),
  config  = require('./user'),
  release = require('./project/release')
;


module.exports = {

  banner : release.banner,

  log: {
    created: function(file) {
      return 'Created: ' + file;
    },
    modified: function(file) {
      return 'Modified: ' + file;
    }
  },

  filenames: {
    concatenatedCSS            : 'semantic.css',
    concatenatedJS             : 'semantic.js',
    concatenatedMinifiedCSS    : 'semantic.min.css',
    concatenatedMinifiedJS     : 'semantic.min.js',
    concatenatedRTLCSS         : 'semantic.rtl.css',
    concatenatedMinifiedRTLCSS : 'semantic.rtl.min.css'
  },

  regExp: {

    comments: {

      // remove all comments from config files (.variable)
      variables : {
        in  : /(\/\*[\s\S]+?\*\/+)[\s\S]+?\/\* End Config \*\//,
        out : '$1',
      },

      // add version to first comment
      license: {
        in  : /(^\/\*[\s\S]+)(# Semantic UI )([\s\S]+?\*\/)/,
        out : '$1$2' + release.version + ' $3'
      },

      // adds uniform spacing around comments
      large: {
        in  : /(\/\*\*\*\*[\s\S]+?\*\/)/mg,
        out : '\n\n$1\n'
      },
      small: {
        in  : /(\/\*---[\s\S]+?\*\/)/mg,
        out : '\n$1\n'
      },
      tiny: {
        in  : /(\/\* [\s\S]+? \*\/)/mg,
        out : '\n$1'
      }
    },

    theme: /.*(\/|\\)themes(\/|\\).*?(?=(\/|\\))/mg

  },

  settings: {

    /* Remove Files in Clean */
    del: {
      silent : true
    },

    concatCSS: {
      rebaseUrls: false
    },

    /* Comment Banners */
    header: {
      title      : release.title,
      version    : release.version,
      repository : release.repository,
      url        : release.url
    },

    plumber: {
      less: {
        errorHandler: function(error) {
          var
            regExp = {
              variable : /@(\S.*?)\s/,
              theme    : /themes[\/\\]+(.*?)[\/\\].*/,
              element  : /[\/\\]([^\/\\*]*)\.overrides/
            },
            theme,
            element
          ;
          if(error.filename.match(/theme.less/)) {
            if(error.line == 5) {
              element  = regExp.variable.exec(error.message)[1];
              if(element) {
                console.error('Missing theme.config value for ', element);
              }
              console.error('Most likely new UI was added in an update. You will need to add missing elements from theme.config.example');
            }
            if(error.line == 46) {
              element = regExp.element.exec(error.message)[1];
              theme   = regExp.theme.exec(error.message)[1];
              console.error(theme + ' is not an available theme for ' + element);
            }
          }
          else {
            console.log(error);
          }
          this.emit('end');
        }
      }
    },

    /* What Browsers to Prefix */
    prefix: {
      browsers: [
        'last 2 versions',
        '> 1%',
        'opera 12.1',
        'bb 10',
        'android 4'
      ]
    },

    /* File Renames */
    rename: {
      minJS     : { extname : '.min.js' },
      minCSS    : { extname : '.min.css' },
      rtlCSS    : { extname : '.rtl.css' },
      rtlMinCSS : { extname : '.rtl.min.css' }
    },

    /* Minified CSS Concat */
    minify: {
      processImport       : false,
      restructuring       : false,
      keepSpecialComments : 1,
      roundingPrecision   : -1,
    },

    /* Minified JS Settings */
    uglify: {
      mangle           : true,
      preserveComments : 'some'
    },

    /* Minified Concat CSS Settings */
    concatMinify: {
      processImport       : false,
      restructuring       : false,
      keepSpecialComments : false,
      roundingPrecision   : -1,
    },

    /* Minified Concat JS */
    concatUglify: {
      mangle           : true,
      preserveComments : false
    }

  }
};
