const utils = require("./utils.js");
process.env.NODE_ENV = process.env.NODE_ENV || "development";
const argv = utils.transform(process.argv.slice(2));
const path = require("path");
const src = path.resolve(__dirname, "..", "src");
const dist = path.resolve(__dirname, "..", "dist");
const factory = require("./factory.js");
const isMultiPages = true;
let multiPages = {};
const isProd = (process.env.NODE_ENV === "production") || argv["env.prod"];
multiPages.commonChunkNames = ["common"];
let miniOpt = {
  collapseWhitespace           : true,
  removeRedundantAttributes    : true,
  useShortDoctype              : true,
  removeEmptyAttributes        : true,
  removeStyleLinkTypeAttributes: true,
  keepClosingSlash             : true,
  minifyJS                     : true,
  minifyCSS                    : true
};
const htmlExample = {
  title         : "App",
  filename      : path.resolve(dist, "index.html"),
  inject        : "body",
  hash          : true,
  excludeChunks : [],//Allows you to skip some chunks
  chunksSortMode: "dependency",
  minify        : isProd && miniOpt
};
(function (isMultiPages) {
  if (isMultiPages) {
    multiPages.allEntries = {};
    let allEntries = utils.getEntry("src/js/", "**/*.js");//根据js文件批量设置entry，注意对应
    Object.keys(allEntries).forEach(function (key) {
      multiPages.allEntries[key] = path.resolve(src, "js",
                                                allEntries[key].slice()
                                                .join(""));
      //下面这个是为了能够在htmk与ejs中使用css（利用entry），而css可以使用extract-text分离成单个文件
      //https://github.com/jantimon/html-webpack-plugin/issues/579#issuecomment-277150634
      multiPages.allEntries["__pages-"+key] =path.resolve(src, "templates",
                                                          allEntries[key].slice()
                                                          .join(""));
    });
    let pages = Object.keys(
      utils.getEntry("src/templates/", "@(*.html|*.ejs)"));
    multiPages.allHtmlPages = [];
    pages.forEach(function (page) {
      let config = {
        // template      : "!!ejs-compiled-loader!!extract-loader!!html-loader?attrs[]=img:src&attrs[]=img:data-src&interpolate=require!" +
        // path.resolve(src, "templates", page),
        template      : "!!extract-loader!!html-loader?attrs[]=img:src&attrs[]=img:data-src&interpolate=require!!ejs-compiled-loader!" + path.resolve(src, "templates", page),
        filename      : path.resolve(dist, page + ".html"),
        inject        : "body",
        hash          : true,
        excludeChunks : [],//Allows you to skip some chunks
        chunksSortMode: "dependency",
        // chunk:[page].push(commonChunkNames),
        minify        : isProd && miniOpt

      };
      if (page in multiPages.allEntries) {
        config.chunks = multiPages.commonChunkNames.concat([page]);
      }
      multiPages.allHtmlPages.push(config);
    });
  } else {
    multiPages.allEntries = {app: path.resolve(src, "js", "index.js")};
    multiPages.allHtmlPages = [htmlExample];
  }
})(isMultiPages);

module.exports = multiPages;