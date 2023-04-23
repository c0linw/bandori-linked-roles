const { defineConfig } = require('@vue/cli-service')
require('dotenv').config();
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    devServer: {
      proxy: {
        '^/api': {
          target: 'http://localhost:3000',
        },
      },
    },
  },
})
