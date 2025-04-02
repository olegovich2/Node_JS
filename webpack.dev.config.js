const { default: merge } = require('webpack-merge');
const webpackConfig = require('./webpack.config');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = merge(webpackConfig, {
	mode: 'development',
	output: {
		filename: '[name].js',
	},
	devServer: {
		port: 5000,
		hot: true,
		open: true,
	},
	devtool: 'source-map',
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
		}),
	],
});