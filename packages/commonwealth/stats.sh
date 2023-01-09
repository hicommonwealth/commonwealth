#!/bin/sh
# Generates and visualizes webpack module sizes
webpack --json --mode=development --config webpack/webpack.config.prod.js > stats.json
yarn webpack-bundle-analyzer stats.json
