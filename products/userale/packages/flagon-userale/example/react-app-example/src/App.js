/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import logo from "./logo.svg";
import "./App.css";
import * as userale from "flagon-userale";

function App() {
  const handleOnClick = () => {
    userale.start();
  };

  userale.options({
    autostart: false,
    logCountThreshold: "1",
    transmitInterval: "1000",
    toolName: "Apache UserALE React Example",
  });

  userale.filter(function (log) {
    var type_array = [
      "mouseup",
      "mouseover",
      "mousedown",
      "keydown",
      "dblclick",
      "blur",
      "focus",
      "input",
      "wheel",
      "scroll",
    ];
    var logType_array = ["interval"];
    return (
      !type_array.includes(log.type) && !logType_array.includes(log.logType)
    );
  });

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p onClick={handleOnClick}>Click this text to start userale.</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
