const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const { outputConfig, copyPluginPatterns, entryConfig } = require("./env.config");

module.exports = (env, options) => {
    return {
        mode: options.mode,
        entry: entryConfig,
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
            new HtmlWebPackPlugin({
                template: "./src/index.html"
            })
        ]
    }
}