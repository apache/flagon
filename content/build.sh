#!/bin/bash

set -e  # Exit immediately if any command fails

# Step 1: Install Ruby dependencies (if Ruby is present)
if command -v ruby &>/dev/null; then
  echo "Installing Ruby dependencies..."
  gem install bundler
  bundle install
else
  echo "Ruby is not installed, skipping Ruby setup."
fi

# Step 2: Install Node.js dependencies (if npm is present)
if command -v npm &>/dev/null; then
  echo "Installing Node.js dependencies..."
  npm install -g
else
  echo "npm is not installed, skipping Node.js setup."
fi

# Step 3: Build the Jekyll site
echo "Building the Jekyll site..."
bundle exec jekyll build

echo "Build completed successfully!"
