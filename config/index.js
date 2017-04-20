//对基础配置对象进行拓展和覆盖，或者两者共有的配置都可以写在这里
const utils = require("./utils.js");
const path = require("path");
const src = path.resolve(__dirname, "..", "src");
const dist = path.resolve(__dirname, "..", "dist");
const factory = require("./factory.js");
const pages = require("./html-generator.js");
let extendConfig = {
  host            : "http://127.0.0.1",
  port            : "4303",
  /*rewrite:
   [
   { from: /^\/$/, to: '/views/landing.html' },
   { from: /^\/subpage/, to: '/views/subpage.html' },
   { from: /./, to: '/views/404.html' }
   ]*/
  rewrite         : [],
  proxy           : {},
  cleanDir        : ["dist"],
  globalVar       : {},
  src             : src,
  dist            : dist,
  context         : src,
  target          : "web",
  entry           : pages.allEntries,//object or getEntry()
  alias           : {},
  extensions      : [".js", ".jsx", ".less", ".ejs", ".html"],
  dllEntry        : {}, /*{'jquery': ['jquery'],'angular': ['angular', 'angular-router', 'angular-sanitize']}*/
  /* 以 names: ['vendor', 'manifest'] 为例
   首先把重复引用的库打包进vendor.js, 这时候我们的代码里已经没有重复引用了, chunk文件名存在vendor.js中,
   然后我们在执行一次CommonsChunkPlugin, 把所有chunk的文件名打包到manifest.js中.
   这样我们就实现了chunk文件名和代码的分离. 这样修改一个js文件不会导致其他js文件在打包时发生改变, 只有manifest.js会改变*/
  commonChunkNames: pages.commonChunkNames,//for CommonsChunkPlugin.names option
  /*"all",[object-array]*/
  htmlWebpack     : pages.allHtmlPages,
  /*[
   { from: 'node_modules/bootstrap/dist/css', to: 'css/'},
   { from: 'node_modules/bootstrap/dist/fonts', to: 'fonts/'}
   ]*/
  copyAssets      : [],
  /*插入htmlWebpackPlugin*/
  /*['css/bootstrap.min.css', 'css/bootstrap-theme.min.css']*/
  includeAssets   : [],
  //supply directory variables relative to src fold
  srcSubDirectory : {
    "assets"    : "assets/",
    "css"       : "css/",
    "js"        : "js/",
    "templates" : "templates/",
    "rooter"    : "rooter/",
    "utils"     : "utils/",
    "components": "components/",
    "sprites"   : "assets/sprites/"
  }
};
module.exports = function (env) {
  extendConfig = utils.extend(factory(env), extendConfig);
  return extendConfig;
};
