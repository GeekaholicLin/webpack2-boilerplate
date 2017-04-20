const webpack = require("webpack");
const path = require("path");
const configFactory = require("./index.js");
// variables
process.env.NODE_ENV = process.env.NODE_ENV || "development";
const config = configFactory(process.env.NODE_ENV);
const src = config.src || path.resolve(__dirname, "..", "src");
const dist = config.dist || path.resolve(__dirname, "..", "dist");
const context = config.context || src;
const target = config.target || "web";
const dllEntry = config.dllEntry || {};
module.exports = {
  context    : context,
  devtool    : "cheap-module-eval-source-map",
  target     : target,
  resolve    : {
    modules: ["node_modules", src],
  },
  entry      : dllEntry,
  output     : {
    filename: "[name].dll.js",
    path    : dist,
    library : "[name]",
  },
  plugins    : [
    new webpack.DllPlugin({
                            path: path.join(dist, "[name].dll.manifest.json"),
                            name: "[name]",
                          }),
  ],
  performance: {
    hints: false,
  },
};