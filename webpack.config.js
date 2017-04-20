//1. each loader & plugin repo
//2. articles:(重要性排序)
//[webpack 2 打包实战](https://github.com/fenivana/webpack-in-action)
//[基于 webpack
// 搭建前端工程基础篇](https://github.com/chenbin92/react-redux-webpack-starter/issues/1)
// 如果webpack.config.js导出的是一个function, 那么webpack会执行它, 并把返回的结果作为配置对象

//Module
const path = require("path");
const webpack = require("webpack");
const utils = require("./config/utils.js");
//Webpack Plugin
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpackMerge = require("webpack-merge");
const HtmlWebpackIncludeAssetsPlugin = require(
  "html-webpack-include-assets-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const htmlInsertLinkAuto = require("./config/plugin.js");
// variables
process.env.NODE_ENV = process.env.NODE_ENV || "development";
const config = require("./config/index.js")(process.env.NODE_ENV);
const argv = utils.transform(process.argv.slice(2));
const isProd = (process.env.NODE_ENV === "production") || argv["env.prod"];
const isDebug = argv["env.debug"] || argv["debug"] || false;
const isHot = argv["hot"] || false;
//config
const host = argv["host"] || config.host || "http://127.0.0.1";
const port = argv["port"] || config.port || 4303;
const rewrite = config.rewrite || [];
const proxy = config.proxy || {};
const publicPath = config.publicPath || "";
const cleanDir = config.cleanDir || ["dist"];
const globalVar = config.globalVar || {};
const src = config.src || path.resolve(__dirname, "src");
const dist = config.dist || path.resolve(__dirname, "dist");
const context = config.context || src;
const target = config.target || "web";
const entry = config.entry || {};
const alias = config.alias || {};
const extensions = config.extensions || [".js", ".jsx", ".less"];
const htmlWebpack = config.htmlWebpack || [];
const copyAssets = config.copyAssets || [];
const includeAssets = config.includeAssets || [];
const chunkPath = config.srcSubDirectory.js || "";
//webpack extend config
const extendWebpackConfig = isProd
  ? require("./config/webpack.prod.js")
  : require("./config/webpack.dev.js");
//plugins slice
//热启动
//hmr机制适用于单页应用
var addedPlugins = isHot ? [new webpack.HotModuleReplacementPlugin()] : [];
//拷贝文件到目的文件夹，常用于使用npm安装的前端模块（如bootstrap）拷贝
addedPlugins.push(new CopyWebpackPlugin(copyAssets));
//https://segmentfault.com/a/1190000004516832
htmlWebpack.forEach(function (item) {
  addedPlugins.push(new HtmlWebpackPlugin(item));
  addedPlugins.push(new htmlInsertLinkAuto({options:""}))
});
//将assets插入生成的html
addedPlugins.push(
  new HtmlWebpackIncludeAssetsPlugin({assets: includeAssets, append: true})
);

const baseWebpackConfig = {
  context: context,//用于从配置中解析入口起点(entry point)和加载器(loader)
  target : target,
  //https://doc.webpack-china.org/concepts/module-resolution/#-
  //解析规则
  resolve: {
    modules   : [src, "node_modules"],//模块形式的导入讲在此数组指定的目录查找
    alias     : alias,//路径别名，import或require时再以解析规则(绝对路径、相对路径、模块形式)进行路径解析
    extensions: extensions//当模块形式的导入指向文件而文件没有后缀名时，使用数组指定的后缀名,不再需要传一个空字符串
  },

  entry    : entry,
  //使用webpack-dev-server启动开发环境时, entry文件是没有[chunkhash]的, 用了会报错
  //将开发和生产模式的配置分开，并在开发模式中使用 [name].js 的文件名， 在生产模式中使用 [name].[chunkhash].js 文件名。
  output   : {
    path         : dist,
    filename     : isProd ? chunkPath + "[name].[chunkhash:6].js" : chunkPath +
      "[name].js",//entry chunk file name
    chunkFilename: isProd
      ? chunkPath + "[name].[chunkhash:6].chunk.js"
      : chunkPath + "[name].chunk.js",//non-entry chunk file name
    publicPath   : publicPath,
    pathinfo     : !isProd
  },
  module   : {
    //noParse的文件不应该被 import, require, define
    // 或者任何其他导入机制调用,忽略大型库文件(library)可以提高构建性能 当模块没有 AMD/CommonJS 的版本时，并且你希望直接引入
    // dist版本，你可以将这个模块标记为 noParse noParse: noParse,
    /** example
     //A Rule can be separated into three parts — Conditions, Results and nested Rules.
     {
         //Conditions:
         //test只是条件语句的一种情况，还有`exclude`等，更多见https://webpack.js.org/configuration/module/#rule-conditions
         // 最佳实践：
         // - 只在 test 和 文件名匹配 中使用正则表达式
         // - 在 include 和 exclude 中使用绝对路径数组
         // - 尽量避免 exclude，更倾向于使用 include
         test: /\.html$/,
         include: [src],
         exclude: [dist],
         issuer: { test:[],exclude:[],include:""},//使用导入文件的调用文件的条件限制
         //Results:
         loader: 'html-loader?attrs=img:src'
         use:[{loader:"",options:{}}]//单个loader的推荐写法
         use: [{
             loader: 'xxxx',
             options: {}
         }]//多个loader推荐写法
     },
     **/
    rules: [
      //Loaders for HTML
      {
        test   : /\.html$/,
        include: [src],
        use    : [
          {
            loader : "html-loader",
            options: {
              attrs                : ["img:src", "img:data-src", "img:_href", "link:href"],
              minimize             : isProd,
              removeAttributeQuotes: false,
              interpolate          : "require"//插值。${require('./components/gallery.html')}
            }
          }
        ]
      },
      //Loaders for EJS
      {
        test: /\.ejs$/,
        use : [
          // 根据需要打开
          // {
          //     loader: "apply-loader",//调用loader返回的函数的一个loader!!
          //     options: {}
          //     /*!// => sourceFn(1, 2)
          //      require("apply?args[]=1&args[]=2!functionReturningLoader");
          //
          //      // Call with an object/array
          //      // => sourceFn({a: 1, b:2})
          //      require("apply?{obj: {a: 1, b: 2}}!functionReturningLoader");
          //
          //      // Call with an object/array declared in the webpack.config
          //      // => sourceFn(require('webpack.config').customConfig)
          //      require("apply?config=customConfig!functionReturningLoader");*/
          // },
          {
            loader : "ejs-compiled-loader",
            options: {
              beautify    : isProd,
              compileDebug: isDebug,
              htmlmin     : isProd
            }
          }]

      },
      //Loaders for CSS
      //Loaders for LESS
      {
        test : /\.(css|less)$/,
        oneOf: [
          //fix ejs templates bugs
          {
            compiler: /html-webpack-plugin/,
            loader  : "isomorphic-style-loader!css-loader?module&&localIdentName=[name]_[local]_[hash:base64:3]!postcss-loader!less-loader?sourceMap"
          },
          {
            use: ExtractTextPlugin.extract(
              {
                // 使用code
                // splitting，可以实现将这部分不会使用的代码分离出去，独立成一个单独的文件，实现按需加载。
                // 那么如果在这些分离出去的代码中如果有使用require引入样式文件，那么使用ExtractTextPlugin这部分样式代码是不会被抽取出来的。
                fallback: "style-loader",
                use     : [
                  {
                    loader : "css-loader",
                    options: {
                      modules       : true,
                      sourceMap     : true,
                      importLoaders : 2,
                      localIdentName: "[path][name]__[local]--[hash:base64:5]",
                      camelCase     : "dashes"//.class-name// {},import {// className// }// from// 'file.css';
                    }
                  },
                  {
                    loader : "postcss-loader",
                    options: {
                      config: path.resolve(
                        __dirname,
                        "postcss.config.js")
                    }
                  },
                  {
                    loader : "less-loader",
                    options: {
                      sourceMap : true,
                      strictMath: true,
                      noIeCompat: true,
                      //Modules, that can't be
                      // resolved in the local
                      // folder, will be searched
                      // in the given paths.
                      path      : [path.resolve(__dirname, "node_modules")]
                    }
                  }
                ]
              }
            )
          }
        ]

      },
      //Loaders for Fonts
      {
        test: /\.(woff|woff2|eot|ttf|svg)(\?.*$|$)/,
        use : [{
          loader : "url-loader",
          options: {
            limit: 1000,
            name : utils.assetsPath(config.distAssetsPath,
                                    "fonts/[name].[hash:7].[ext]")
          }
        }]
      },
      //Loaders for JavaScript
      {
        //http://eslint.org/docs/user-guide/configuring
        //http://eslint.cn/docs/user-guide/configuring
        test   : /\.js[x]?$/,
        enforce: "pre",
        include: [src],
        exclude: [/node_modules/],
        use    : [{
          loader : "eslint-loader",
          options: {
            failOnError  : true,
            failOnWarning: false,
            cache        : !isDebug
            // outputReport:{
            //     filePath: 'eslint.log.xml'//relative to the webpack config:
            // output.path }
          }
        }]
      },
      {
        //http://browserl.ist/?q=%3E+0.05%25
        //https://segmentfault.com/a/1190000008159877
        //https://excaliburhan.com/post/babel-preset-and-plugins.html
        test   : /\.js[x]?$/,
        include: [src],
        exclude: /(node_modules|bower_components)/,
        use    : [{
          loader : "babel-loader",
          options: {
            presets       : ["env", "stage-0"],
            plugins       : ["transform-runtime"],
            cacheDirectory: !isProd
          }
        }]
      }
    ]
  },
  plugins  : [
    //提供全局变量，更多全局变量的方法见https://doc.webpack-china.org/guides/shimming/
    //自动加载模块。 任何时候，当 identifier 被当作未赋值的变量时， module 就会自动被加载，并且 identifier 会被这个
    // module 输出的内容所赋值。 这样在源文件中就不需要var $ = require('')了
    new webpack.ProvidePlugin(globalVar),
    //A webpack plugin to remove/clean your build folder(s) before building
    //构建清除目录
    new CleanWebpackPlugin(cleanDir),

    //出错不退出
    new webpack.NoEmitOnErrorsPlugin()
  ].concat(addedPlugins)
  .concat(new ExtractTextPlugin(
    {
      //It moves all the require("style.css")s in entry chunks into a separate single CSS file.
      // https://github.com/zhengweikeng/blog/blob/master/posts/2016/webpack%E5%85%B3%E4%BA%8E%E6%A0%B7%E5%BC%8F%E7%9A%84%E5%A4%84%E7%90%86.md
      // 根据webpack官网中关于stylesheet的说法，建议是不要将allChunks设为true，即只是将样式嵌入到分离文件中。这个可能还是需要具体问题具体分析了。
      filename : (getPath) => {
        return getPath("css/[name].[contenthash:6].css").replace("css/js", "css");
      },
      allChunks: true
    }
  )),
  //https://doc.webpack-china.org/configuration/dev-server/
  devServer: {
    // host              : host,
    port              : port,
    publicPath        : publicPath,
    contentBase       : "dist",
    watchContentBase  : !isHot,
    watchOptions      : {
      aggregateTimeout: 300,
      poll            : 1000,
      ignored         : /node_modules/
    },
    compress          : true,//gzip
    open              : true,
    noInfo            : true,
    clientLogLevel    : "error",//当使用内联模式(inline mode)时，在开发工具(DevTools)的控制台(console)将显示消息
    stats             : "errors-only",
    headers           : {"Access-Control-Allow-Origin": "*"},
    // historyApiFallback
    // Repo:https://github.com/bripkens/connect-history-api-fallback it will
    // change the requested location to the index you specify (default being
    // /index.html) historyApiFallback常用于SPA，当符合以下条件的，返回index
    // option指定的地址(默认为/index.html) 1.GET请求 2. 请求接收类型为text/html 3. 非文件直接请求 4.
    // 不符合rewrite的from规则
    historyApiFallback: {
      htmlAcceptHeaders: ["text/html", "application/xhtml+xml"],
      //Override the index when the request url matches a regex pattern.
      index            : "/index.html",
      rewrite          : rewrite,//类似路由
      verbose          : isHot
    },
    // https://github.com/chimurai/http-proxy-middleware 更多代理的设置
    proxy             : proxy
  }
};

module.exports = webpackMerge(baseWebpackConfig, extendWebpackConfig);


