#!/bin/bash 
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.


install_python_versions() {
  versions=("3.8" "3.9" "3.10" "3.11")
  for version in "${versions[@]}"; do
    echo "--------------------------------------------------"
    echo "Installing python $version"
    echo "--------------------------------------------------"
    pyenv install -s "$version"
    pyenv local "$version"
  done
}

# Install pyenv
if which pyenv; then
  install_python_versions
else
  echo "Trying to install pyenv for you."
  curl https://pyenv.run | bash

  user_shell="$SHELL"

  if echo "$user_shell" | grep -q "bash"; then
      rc_file="$HOME/.bashrc"
  elif echo "$user_shell" | grep -q "zsh"; then
      rc_file="$HOME/.zshrc"
  elif echo "$user_shell" | grep -q "fish"; then
      rc_file="$HOME/.config/fish/config.fish"
  else
      echo "Unsupported shell: $user_shell"
      exit 1
  fi

  install_python_versions
fi
