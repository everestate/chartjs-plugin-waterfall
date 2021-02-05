import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import uglify from 'rollup-plugin-uglify';
import merge from 'lodash/merge';

const common = {
  input: 'src/index.js',
  name: 'chartjsPluginWaterfall',
  sourcemap: true,
};

const babelOptions = {
  plugins: ['external-helpers'],
  exclude: 'node_modules/**',
};

const lib = merge({}, common, {
  output: {
    format: 'cjs',
    file: 'lib/chartjs-plugin-waterfall.js',
  },
  plugins: [
    eslint(),
    babel(babelOptions),
  ],
});

const umdDist = merge({}, common, {
  output: {
    format: 'umd',
    file: 'dist/chartjs-plugin-waterfall.js',
  },
  plugins: [
    eslint(),
    babel(babelOptions),
  ],
});

const minUmdDist = merge({}, common, {
  output: {
    format: 'umd',
    file: 'dist/chartjs-plugin-waterfall.min.js',
  },
  plugins: [
    eslint(),
    babel(babelOptions),
    uglify(),
  ],
});

export default [lib, umdDist, minUmdDist];
