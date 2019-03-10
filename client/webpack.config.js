var path = require("path");
var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var BrowserSyncPlugin = require("browser-sync-webpack-plugin");

var definePlugin = new webpack.DefinePlugin({
    __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || "true"))
});

module.exports = {
    mode: "development",
    entry: {
        app: ["babel-polyfill", path.resolve(__dirname, "src/main.ts")]
    },
    devtool: "inline-source-map",
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    output: {
        pathinfo: true,
        path: path.resolve(__dirname, "dist"),
        publicPath: "./dist/",
        filename: "bundle.js"
    },
    watch: true,
    plugins: [
        definePlugin,
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./public/index.html",
            favicon: "./public/favicon.ico",
            manifest: "./public/manifest.json",
            chunks: ["vendor", "app"],
            chunksSortMode: "manual",
            hash: false
        }),
        new BrowserSyncPlugin({
            host: process.env.IP || "localhost",
            port: process.env.PORT || 3000,
            server: {
                baseDir: ["./", "./dist"]
            },
            target: "http://localhost:8080",
            ws: true
        })
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "all",
                    filename: "vendor.bundle.js"
                }
            }
        }
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
