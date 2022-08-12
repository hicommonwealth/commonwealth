#!/bin/bash

wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

export CHROME_BIN=/usr/bin/google-chrome
export GOOGLE_CHROME_BIN=/usr/bin/google-chrome
export GOOGLE_CHROME_SHIM=/usr/bin/google-chrome