const webpack = require('webpack');
const path = require('path');

const srcDir = './src/';

module.exports = (env, argv) => ({
    entry: {
        missionsScript: './src/missionsScript.js',
    },output: {
        path: path.join(__dirname, 'public/js'),
        publicPath: "/js",
        filename: "[name].js"
    },
    target: "web",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
        ]
    },
});