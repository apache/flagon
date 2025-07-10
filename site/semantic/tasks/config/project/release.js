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

/*******************************
         Release Config
*******************************/

var
  requireDotFile = require('require-dot-file'),
  config,
  npmPackage,
  version
;


/*******************************
         Derived Values
*******************************/

try {
  config = requireDotFile('semantic.json');
}
catch(error) {}


try {
  npmPackage = require('../../../package.json');
}
catch(error) {
  // generate fake package
  npmPackage = {
    name: 'Unknown',
    version: 'x.x'
  };
}

// looks for version in config or package.json (whichever is available)
version = (npmPackage && npmPackage.version !== undefined && npmPackage.name == 'semantic-ui')
  ? npmPackage.version
  : config.version
;


/*******************************
             Export
*******************************/

module.exports = {

  title      : 'Semantic UI',
  repository : 'https://github.com/Semantic-Org/Semantic-UI',
  url        : 'http://www.semantic-ui.com/',

  banner: ''
    + ' /*' + '\n'
    + ' * # <%= title %> - <%= version %>' + '\n'
    + ' * <%= repository %>' + '\n'
    + ' * <%= url %>' + '\n'
    + ' *' + '\n'
    + ' * Copyright 2014 Contributors' + '\n'
    + ' * Released under the MIT license' + '\n'
    + ' * http://opensource.org/licenses/MIT' + '\n'
    + ' *' + '\n'
    + ' */' + '\n',

  version    : version

};
