const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// .db ファイルをアセットとして認識させる
config.resolver.assetExts.push('db');

module.exports = config;