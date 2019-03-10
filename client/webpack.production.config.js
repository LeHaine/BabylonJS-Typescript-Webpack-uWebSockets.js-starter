var path = require("path");
var webpack = require("webpack");
var CleanWebpackPlugin = require("clean-webpack-plugin");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var WorkboxPlugin = require("workbox-webpack-plugin");
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");

var definePlugin = new webpack.DefinePlugin({
    __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || "false"))
});

module.exports = {
    mode: "production",
    entry: {
        app: ["babel-polyfill", path.resolve(__dirname, "src/main.ts")]
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "./",
        filename: "js/bundle.js"
    },
    plugins: [
        definePlugin,
        new CleanWebpackPlugin(),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new HtmlWebpackPlugin({
            filename: "index.html", // path.resolve(__dirname, 'build', 'index.html'),
            template: "./public/index.html",
            favicon: "./public/favicon.ico",
            manifest: "./public/manifest.json",
            chunks: ["vendor", "app"],
            chunksSortMode: "manual",
            hash: true
        }),
        new CopyWebpackPlugin([{ from: "public/assets", to: "dist/assets" }]),
        new WorkboxPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true
        })
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "initial",
                    filename: "js/vendor.bundle.js",
                    enforce: true
                }
            }
        },
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: true,
                uglifyOptions: {
                    output: {
                        comments: false
                    }
                }
            })
        ]
    },
    module: {
        rules: [
            {
                test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                loader: require.resolve("file-loader"),
                options: {
                    name: "/assets/[name].[hash:8].[ext]"
                }
            },
            {
                test: /\.js$/,
                use: ["babel-loader"],
                include: path.join(__dirname, "src")
            },
            { test: /\.js$/, loader: "source-map-loader", enforce: "pre" },
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
        ]
    },
    node: {
        fs: "empty",
        net: "empty",
        tls: "empty"
    },
    externals: {
        oimo: "OIMO",
        cannon: "CANNON",
        earcut: "EARCUT"
    }
};
