const paths = require('react-scripts/config/paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require("path");
const TARGET_BROWSER = process.env.TARGET_BROWSER;

module.exports = {
    paths: (paths, env) => {
        paths.appBuild = path.resolve(__dirname, path.join("builds", TARGET_BROWSER));
        return paths;
    },
    webpack: override,
};

// Function to override the CRA webpack config
function override(config, env) {
    // Replace single entry point in the config with multiple ones
    // Note: you may remove any property below except "popup" to exclude respective entry point from compilation
    config.entry = {
        popup: paths.appIndexJs,
        background: paths.appSrc + '/background',
        content: paths.appSrc + '/content'
    };
    // Change output filename template to get rid of hash there
    config.output.filename = 'static/js/[name].js';
    // Disable built-in SplitChunksPlugin
    config.optimization.splitChunks = {
        cacheGroups: {default: false}
    };
    // Disable runtime chunk addition for each entry point
    config.optimization.runtimeChunk = false;

    // Shared minify options to be used in HtmlWebpackPlugin constructor
    const minifyOpts = {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
    };
    const isEnvProduction = env === 'production';

    // Custom HtmlWebpackPlugin instance for index (popup) page
    const indexHtmlPlugin = new HtmlWebpackPlugin({
        inject: true,
        chunks: ['popup'],
        template: paths.appHtml,
        filename: 'popup.html',
        minify: isEnvProduction && minifyOpts,
    });
    // Replace original HtmlWebpackPlugin instance in config.plugins with the above one
    config.plugins = replacePlugin(config.plugins,
        (name) => /HtmlWebpackPlugin/i.test(name), indexHtmlPlugin
    );

    // Custom ManifestPlugin instance to cast asset-manifest.json back to old plain format
    const manifestPlugin = new (ManifestPlugin.WebpackManifestPlugin ||
        ManifestPlugin)({
        fileName: 'asset-manifest.json',
    });
    // Replace original ManifestPlugin instance in config.plugins with the above one
    config.plugins = replacePlugin(config.plugins,
        (name) => /ManifestPlugin/i.test(name), manifestPlugin
    );

    // Custom MiniCssExtractPlugin instance to get rid of hash in filename template
    const miniCssExtractPlugin = new MiniCssExtractPlugin({
        filename: 'static/css/[name].css'
    });
    // Replace original MiniCssExtractPlugin instance in config.plugins with the above one
    config.plugins = replacePlugin(config.plugins,
        (name) => /MiniCssExtractPlugin/i.test(name), miniCssExtractPlugin
    );

    // Remove GenerateSW plugin from config.plugins to disable service worker generation
    config.plugins = replacePlugin(config.plugins,
        (name) => /GenerateSW/i.test(name)
    );

    const copyWebpackPlugin = new CopyWebpackPlugin({
        patterns: [{
            from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
        }, {
            from: `manifest/manifest_${TARGET_BROWSER}.json`,
            to: 'manifest.json'
        }],
    })

    config.plugins.push(copyWebpackPlugin);

    return config;
}

// Utility function to replace/remove specific plugin in a webpack config
function replacePlugin(plugins, nameMatcher, newPlugin) {
    const i = plugins.findIndex((plugin) => {
        return plugin.constructor && plugin.constructor.name &&
            nameMatcher(plugin.constructor.name);
    });
    return i > -1 ?
        plugins.slice(0, i).concat(newPlugin || []).concat(plugins.slice(i + 1)) :
        plugins;
}
