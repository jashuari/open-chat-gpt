const path = require('path');

module.exports = {
  // Your existing Webpack configuration
  resolve: {
    fallback: {
      net: require.resolve('net'),
      tls: require.resolve('tls'),
      util: require.resolve('util'),
      crypto: require.resolve('crypto-browserify'),
      fs: false, // You can use false here since 'fs' is not compatible with the browser environment
      path: require.resolve('path-browserify'),
    },
  },
};
