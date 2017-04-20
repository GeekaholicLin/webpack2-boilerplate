//tools for configuration
const path = require("path");
const glob = require("glob");
var utils = {};
// extend base configure
utils.extend = function extend(target, src) {
  if (src) {
    Object.keys(src).forEach(function(key) {
      if (src.hasOwnProperty(key)) {
        target[key] = src[key];
      }
    });
  }
  return target;
};
/**
 * Transforms an array of arguments to key value pairs
 * @param array the array to transform to an object of key value pairs
 * @example
 * arrayToKeyValue([ '--env.dev', '--port', '8084', '--content-base', 'src' ]);
 * // Returns { 'env.dev': true, port: '8084', 'content-base': 'src' }
 */
utils.transform = function(array) {
  const argTokey = function(arg) {
    return String(arg).trim().startsWith("-")
      ? arg.trim().replace(/^[-]+/, "")
      : false;
  };
  var result = {};
  array.forEach(function(current, index) {
    const key = argTokey(current);
    if (key) {
      let val = true;
      if (index < array.length - 1) {
        const n = String(array[index + 1]).trim();
        if (!n.startsWith("-")) {
          val = array[index + 1];
        }
      }
      utils.extend(result, {[key]: val});
    }
  }, {});
  return result;
};
utils.getEntry = function(pathDir, globRe) {
  let globPath = pathDir + globRe;
  let fileNames = glob.sync(globPath);
  let entries = {},
    entry, dirname, basename, pathname, extname;

  for (let i = 0; i < fileNames.length; i++) {
    entry = fileNames[i];
    dirname = path.dirname(entry);
    extname = path.extname(entry);
    basename = path.basename(entry, extname);
    pathname = path.join(dirname, basename);
    pathDir = pathDir.split("/").join(path.sep);//fix bug
    pathname = pathDir ? pathname.replace(pathDir, "") : pathname;
    entries[pathname] = [pathname];
  }
  return entries;
};
utils.assetsPath = function(distAssetsPath, assetsSubDirectory) {
  return path.join(distAssetsPath, assetsSubDirectory);
};
module.exports = utils;