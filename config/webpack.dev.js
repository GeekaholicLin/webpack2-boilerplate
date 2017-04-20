const config = require("./index.js")("development");
const path = require("path");
module.exports = {
  devtool    : "cheap-module-eval-source-map",
  cache      : true,
  bail       : false,
  performance: {
    hints: false,
  },
  module     : {
    rules: [
      //Loaders for images
      {
        test: /\.(jpg|jpeg|png|gif|svg)$/,
        use : [
          {
            loader : "url-loader",
            options: {
              limit: 2048,
              //src/assets/img/small/1.png-->dist/assets/img/small/1.png
              name: "[path][name]-[hash:6].[ext]"
            },
          },
        ],
      },
    ],
  },
};