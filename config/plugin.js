function htmlInsertLinkAuto(options) {
}
htmlInsertLinkAuto.prototype.apply = function(compiler) {
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('html-webpack-plugin-before-html-processing', function(htmlPluginData, callback) {
      let assets = compilation.assets;
      let htmlFileName = htmlPluginData.outputName.split(".")[0];
      let re = new RegExp("^css/__pages-"+htmlFileName+"\\.\\w{6}\\.css$","i");//ExtractTextPlugin file names
      for(let key in assets){
        if(re.test(key)){
          htmlPluginData.html = htmlPluginData.html.replace("</head>","<link rel='stylesheet' href='"+key+"'>"+"$1");
          break;
        }
      }
      callback(null, htmlPluginData);
    });
  });
};

module.exports = htmlInsertLinkAuto;