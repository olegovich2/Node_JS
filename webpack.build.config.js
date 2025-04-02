const { default: merge } = require("webpack-merge");
const webpackConfig = require("./webpack.config");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = merge(webpackConfig, {
  mode: "production",
  output: {
    filename: "[name].[fullhash].js",
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[fullhash].css",
    }),
  ],
});