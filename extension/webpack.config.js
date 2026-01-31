const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        background: './src/background/serviceWorker.ts',
        content: './src/content/main.ts',
        popup: './src/popup/index.tsx'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@components': path.resolve(__dirname, 'src/components'),
            '@content': path.resolve(__dirname, 'src/content'),
            '@background': path.resolve(__dirname, 'src/background'),
            '@shared': path.resolve(__dirname, 'src/shared')
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'src/popup/popup.html', to: 'popup.html' },
                { from: 'src/content/content.css', to: 'content.css' },
                { from: 'public/icons', to: 'icons', noErrorOnMissing: true }
            ]
        })
    ],
    optimization: {
        splitChunks: false
    }
};
