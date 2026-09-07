const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');

const outputPath = path.resolve(__dirname, 'extension', 'dist');
const extensionTsConfig = path.resolve(
  __dirname,
  'tsconfig.extension.json'
);

function loadSupabaseConfig() {
  dotenv.config({
    path: path.resolve(__dirname, '.env.local'),
    quiet: true,
  });

  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const invalidValues = [];

  if (
    !url ||
    !url.startsWith('https://') ||
    /your[-_ ]?project|example/i.test(url)
  ) {
    invalidValues.push('REACT_APP_SUPABASE_URL');
  }

  if (
    !anonKey ||
    /your[-_ ]?anon[-_ ]?key|example/i.test(anonKey)
  ) {
    invalidValues.push('REACT_APP_SUPABASE_ANON_KEY');
  }

  if (invalidValues.length > 0) {
    throw new Error(
      `Chrome extension build requires valid ${invalidValues.join(
        ' and '
      )} values in .env.local. Placeholder values are rejected.`
    );
  }

  return { url, anonKey };
}

function createSupabaseDefinitions(config) {
  return new webpack.DefinePlugin({
    'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(
      config.url
    ),
    'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(
      config.anonKey
    ),
  });
}

function createTypeScriptRule(test) {
  return {
    test,
    exclude: /node_modules/,
    use: {
      loader: 'ts-loader',
      options: {
        configFile: extensionTsConfig,
      },
    },
  };
}

module.exports = (_environment, arguments_) => {
  const mode = arguments_.mode || 'development';
  const supabaseConfig = loadSupabaseConfig();
  const common = {
    mode,
    devtool: mode === 'production' ? false : 'source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
  };

  return [
    {
      ...common,
      name: 'options',
      entry: './extension/options/index.ts',
      output: {
        path: outputPath,
        filename: 'options.js',
      },
      module: {
        rules: [createTypeScriptRule(/\.ts$/)],
      },
    },
    {
      ...common,
      name: 'popup',
      entry: './extension/popup/index.tsx',
      output: {
        path: outputPath,
        filename: 'popup.js',
      },
      module: {
        rules: [
          createTypeScriptRule(/\.tsx?$/),
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
      plugins: [createSupabaseDefinitions(supabaseConfig)],
    },
    {
      ...common,
      name: 'background',
      entry: './extension/background/index.ts',
      experiments: {
        outputModule: true,
      },
      output: {
        path: outputPath,
        filename: 'background.js',
        module: true,
      },
      module: {
        rules: [createTypeScriptRule(/\.ts$/)],
      },
      plugins: [createSupabaseDefinitions(supabaseConfig)],
    },
    {
      ...common,
      name: 'content',
      entry: './extension/content/index.ts',
      output: {
        path: outputPath,
        filename: 'content.js',
      },
      module: {
        rules: [createTypeScriptRule(/\.ts$/)],
      },
    },
  ];
};

module.exports.loadSupabaseConfig = loadSupabaseConfig;
