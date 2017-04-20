const path = require("path");
const webpack = require("webpack");
const ChunkManifestPlugin = require("chunk-manifest-webpack-plugin");
const WebpackChunkHash = require("webpack-chunk-hash");
const SpritesmithPlugin = require("webpack-spritesmith");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
// variables
const configFactory = require("./index.js");
const utils = require("./utils.js");
process.env.NODE_ENV = process.env.NODE_ENV || "development";
const config = configFactory(process.env.NODE_ENV);
const argv = utils.transform(process.argv.slice(2));
const isDebug = argv["env.debug"] || argv["debug"] || false;
//config
const host = argv["host"] || config.host || "127.0.0.1";
const port = argv["port"] || config.port || 4303;
const src = config.src || path.resolve(__dirname, "..", "src");
const dist = config.dist || path.resolve(__dirname, "..", "dist");
const srcAssetsPath = path.resolve(src, config.srcSubDirectory.assets);
// const spritesDir = path.resolve(src,config.srcSubDirectory.sprites);
const srcSpritesDir = path.resolve(src, config.srcSubDirectory.sprites);
const dllEntry = config.dllEntry || [];
const commonChunkNames = config.commonChunkNames || ["common"];
//plugins slice
const dllReferencePlugins = [];
(function () {
  Object.keys(dllEntry).forEach(function (key) {
    dllReferencePlugins.push(
      new webpack.DllReferencePlugin({
                                       context : ".",
                                       manifest: path.join(dist, key +
                                                           "-dll.manifest.json")
                                     })
    );
  });
})();
module.exports = {
  devtool    : "cheap-module-source-map",
  cache      : false,
  bail       : true,
  performance: {
    hints: "warning"
  },
  resolve    : {
    modules: [src, "node_modules", "spritesmith"]//模块形式的导入讲在此数组指定的目录查找
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
              name: "[path][name]-[hash:6].[ext]"
            }
          },
          {
            loader : "image-webpack-loader",
            options: {
              mozjpeg : {
                quality    : 65,
                progressive: true//渐进式图片
              },
              pngquant: {
                // 当压缩后的quality不在范围内则出错
                // quality: "65-90",
                speed  : 4,
                verbose: isDebug
              },
              svgo    : {
                plugins: [{removeViewBox: false}]
              },
              gifsicle: {
                optimizationLevel: 7,
                interlaced       : false
              }
            }
          }
        ]
      }
    ]
  },
  plugins    : [
    new webpack.HashedModuleIdsPlugin(),
    new WebpackChunkHash(),
    new ChunkManifestPlugin({
                              filename        : "chunk.manifest.json",
                              manifestVariable: "webpackManifest"
                            }),
    //以上三者均为优化
    //雪碧图
    new SpritesmithPlugin({
                            src               : {
                              cwd : srcSpritesDir,
                              glob: "@(*.png|*.jpg|*.jpeg)"
                            },
                            target            : {
                              image: path.resolve(srcSpritesDir,
                                                  "spritesmith/sprite.[hash:6].png"),
                              css  : path.resolve(srcSpritesDir,
                                                  "spritesmith/sprite.less")
                            },
                            apiOptions        : {
                              // 生成的类名以及变量名：.icon-'generateSpriteName'和@[retina-]'generateSpriteName'，默认为文件名
                              // e.g .sprite(@send-normal)使用
                              // generateSpriteName: function (fileName) { var
                              // parsed = path.parse(fileName); var dir =
                              // parsed.dir.split(path.sep); var moduleName =
                              // dir[dir.length - 2]; return moduleName + '__'
                              // + parsed.name; },
                              generateSpriteName: function (fileName) {
                                let paresed = path.parse(fileName);
                                return paresed.name+paresed.ext;
                              },
                              cssImageRef: "~sprite.[hash:6].png"
                            },
                            // retina: '@2x',//根据retina生成两份雪碧图
                            spritesmithOptions: {
                              algorithms: "top-down",
                              padding   : 10
                            }
                          }),
    //js压缩
    new UglifyJSPlugin({
                         // 删除所有的注释
                         comments: false,
                         compress: {
                           unused       : true,    // Enables tree shaking
                           dead_code    : true, // Enables tree shaking
                           warnings     : false,  // 在UglifyJs删除没有用到的代码时不输出警告
                           drop_console : true, // 删除所有的 `console` 语句
                           collapse_vars: true,  // 内嵌定义了但是只用到一次的变量
                           reduce_vars  : true  // 提取出出现多次但是没有定义成变量去引用的静态值
                         },
                         except  : ["$super", "$", "exports", "require"] //排除关键字
                       }),
    new webpack.optimize.CommonsChunkPlugin({
                                              //**
                                              // 将符合引用次数(minChunks)的模块打包到name参数的数组的第一个块里（chunk）,然后数组后面的块(chunk)依次打包(查找entry里的key,没有找到相关的key就生成一个空的块)

                                              // 将entry文件中引用的相同module打包进指定的文件,
                                              // 可以是新建文件,
                                              // 也可以是entry中已存在的文件(name已经存在)

                                              /*但这样还不够, 还记得那个output.chunkFilename参数吗? 这个参数指定了chunk的打包输出的名字,
                                               我们设置为 [id].js?[chunkhash] 的格式. 那么打包时这个文件名存在哪里的呢?
                                               它就存在引用它的文件中. 这就意味着被引用的文件发生改变, 会导致引用它的文件也发生改变.*/

                                              /*那么这时当我们修改页面foo或者bar时, vendor.js也会跟着改变, 而index.js不会变.
                                               那么怎么处理这些chunk, 使得修改页面代码而不会导致entry文件改变呢?*/

                                              /* 以 names: ['vendor', 'manifest'] 为例
                                               首先把重复引用的库打包进vendor.js, 这时候我们的代码里已经没有重复引用了, chunk文件名存在vendor.js中,
                                               然后我们在执行一次CommonsChunkPlugin, 把所有chunk的文件名打包到manifest.js中.
                                               这样我们就实现了chunk文件名和代码的分离. 这样修改一个js文件不会导致其他js文件在打包时发生改变, 只有manifest.js会改变*/

                                              // 最后一个块包含webpack生成的在浏览器上使用各个块的加载代码，所以页面上使用的时候最后一个块必须最先加载
                                              names    : commonChunkNames,
                                              minChunks: 2
                                              // filename:
                                              // "commons.js",//公共chunk
                                              // 的文件名，忽略则以name为输出文件的名字，否则以此为输出文件名字

                                            })
  ].concat(dllReferencePlugins)
};