// Metro bundler config — two fixes for Node v24 + Windows + OneDrive:
//
// 1. Cache redirect: Metro's default cache location ends up with a '?' in
//    the path on Node v24 Windows, which is an illegal filename character.
//    Moving it to %TEMP% (outside OneDrive) fixes the lstat crash.
//
// 2. blockList: prevents Metro from watching .expo-* temp folders that
//    get created and deleted mid-startup, causing ENOENT watch errors.

const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const os = require('os');

const config = getDefaultConfig(__dirname);

// Redirect cache to system temp dir — avoids the OneDrive path issue
config.cacheStores = [
  new FileStore({ root: path.join(os.tmpdir(), 'metro-cache-gostart') }),
];

// Stop Metro watching temp .expo-* folders in node_modules
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList) ? existingBlockList : existingBlockList ? [existingBlockList] : []),
  /node_modules[/\\]\.expo-.*/,
];

module.exports = config;
