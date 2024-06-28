import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import * as packageJson from './package.json';

const banner = `
  /**
   * @license
   * author: ${packageJson.author}
   * ${packageJson.name.replace(/^@.*\//, '')}.js v${packageJson.version}
   * Released under the ${packageJson.license} license.
   */
`;

export default {
  input: 'src/index.ts',
  output: {
    file: `dist/${packageJson.main}`,
    format: 'cjs',
    banner,
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    terser(),
  ],
};
