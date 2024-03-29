import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import url from '@rollup/plugin-url'
import svgr from '@svgr/rollup'

import pkg from './package.json'

export default {
  input: pkg.source,
  output: [
    {
      file: pkg.browser,
      format: 'es',
      sourcemap: true
    }
  ],
  external: [
    '@obsidians/compiler',
    '@obsidians/premium-editor',
    'prettier-plugin-solidity',
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.peerDependencies),
  ],
  plugins: [
    external(),
    postcss({ modules: false }),
    url(),
    json(),
    svgr(),
    babel({ exclude: 'node_modules/**' }),
    resolve(),
    commonjs()
  ],
  watch: {
    include: 'src/**',
  }
}
