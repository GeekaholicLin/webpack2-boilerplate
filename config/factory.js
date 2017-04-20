var path = require("path");
//为webpack配置文件提供基础配置变量
var baseConfig = {
  "development": {
    env           : "development",
    distAssetsPath: "assets",
    publicPath    : ""
  },
  "production" : {
    env           : "production",
    distAssetsPath: "static",
    publicPath    : ""
  },
};
const configFactory = function(env) {
  return baseConfig[env];
};

module.exports = configFactory;