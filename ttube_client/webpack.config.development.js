const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const { outputConfig, copyPluginPatterns, entryConfig, devServer } = require("./env.config")

module.exports = (env, options) => {
    return {
        mode: options.mode,
        entry: entryConfig,
        devServer,
        target: "web",
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
        },
        module: {
            rules: [{
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"],
                }
            ]
        },
        output: {
            filename: "js/[name].js",
            path: path.resolve(__dirname, outputConfig.destPath),
            publicPath: "",
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    GATSBY_BRANCH_ENV: JSON.stringify('ml')
                },
            }),
            new HtmlWebPackPlugin({
                template: "./src/index.html",
                inject: true,
                minify: false
            })
        ]
    }
}