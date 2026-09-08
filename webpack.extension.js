// webpack.extension.js

const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = [
  // Popup UI bundle
  {
    mode: 'development',
    entry: './extension/popup/index.tsx',
    output: {
      path: path.resolve(__dirname, 'extension', 'dist'),
      filename: 'popup.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: '.env.local',
      }),
    ],
  },
  // Background worker bundle
  {
    mode: 'development',
    entry: './extension/background/index.ts',
    output: {
      path: path.resolve(__dirname, 'extension', 'dist'),
      filename: 'background.js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: '.env.local',
      }),
    ],
  },
  // Content script bundle
  {
    mode: 'development',
    entry: './extension/content/index.ts',
    output: {
      path: path.resolve(__dirname, 'extension', 'dist'),
      filename: 'content.js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
  // Options page bundle
  {
    mode: 'development',
    entry: './extension/options/index.tsx',
    output: {
      path: path.resolve(__dirname, 'extension', 'dist'),
      filename: 'options.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: '.env.local',
      }),
    ],
  },
];
