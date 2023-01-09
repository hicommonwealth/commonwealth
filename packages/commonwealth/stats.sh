#!/bin/sh
# Generates and visualizes webpack module sizes
webpack --json --mode=development --config webpack/webpack.prod.config.js > stats.json
yarn webpack-bundle-analyzer stats.json
