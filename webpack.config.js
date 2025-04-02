const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const PATHS = {
  SRC: path.join(__dirname, "src"),
  DIST: path.join(__dirname, "dist"),
  PUBLIC: path.join(__dirname, "public"),
};

module.exports = {
  entry: path.resolve(PATHS.SRC, "index.js"),
  output: {
    assetModuleFilename: "assets/[name].[ext]",
    publicPath: "/",
    path: path.resolve(PATHS.DIST),
    clean: true,
  },
  resolve: {
    extensions: [".js", ".css", ".scss"],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: { sourceMap: true },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: { sourceMap: true },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(PATHS.PUBLIC, "index.html"),
      inject: "body",
    }),
  ],
};