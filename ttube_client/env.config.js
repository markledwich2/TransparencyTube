const outputConfig = {
    destPath: "./dist"
}

// Entry points
// https://webpack.js.org/concepts/entry-points/ 
const entryConfig = { ttube_client: "./src/ttube_client.ts" }

// Copy files from src to dist
// https://webpack.js.org/plugins/copy-webpack-plugin/
const copyPluginPatterns = { patterns: [] }

// Dev server setup
// https://webpack.js.org/configuration/dev-server/
const devServer = {
    contentBase: outputConfig.destPath,
    // https: true,
    // port: "8080",
    // host: "0.0.0.0",
    // disableHostCheck: true
}

module.exports.copyPluginPatterns = copyPluginPatterns
module.exports.entryConfig = entryConfig
module.exports.devServer = devServer
module.exports.outputConfig = outputConfig