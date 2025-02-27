#!/bin/bash 

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
