//https://github.com/ecmadao/Coding-Guide/blob/master/Notes/CSS/PostCSS%E9%85%8D%E7%BD%AE%E6%8C%87%E5%8C%97.md
module.exports = {
  plugins: [
    //下一代css
    require("postcss-cssnext")({"warnForDuplicates": false}),
    //px2rem
    require("postcss-px2rem")({
      baseDpr: 2,             // 基于设备的Dpr
      threeVersion: false,    // 是否生成 @1x, @2x and @3x 三个版本(默认: false)，打开后
      remVersion: true,       // 是否生成rem版本(默认: true)
      remUnit: 75,            // rem转换比例 (默认: 75)
      remPrecision: 5         // rem保留几位数 (默认: 6)
    }),
    //根据stylelint格式化代码
    require("stylefmt"),
    //规则排序
    //https://css-tricks.com/poll-results-how-do-you-order-your-css-properties/
    //https://github.com/hudochenkov/postcss-sorting/blob/master/docs/properties-order.md
    require("postcss-sorting")({
      "properties-order": "alphabetical",
      "unspecified-properties-position": "bottomAlphabetical"
    }),
    //css lint
    require("stylelint")({
      failOnError: true,
      files: ["**/*.s?(a|c)ss", "**/*.less"]
    }),
    //css 优化
    require("cssnano")({safe: true}),
    require("postcss-reporter")({clearMessages: true})
  ],
  map: true
};