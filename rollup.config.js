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

export default [
  {
    input: 'index.js',
    output: [
      {
        file: `dist/${packageJson.main}`,
        format: 'cjs',
        sourcemap: false,
        name: 'loyalmenu',
        banner,
        exports: 'named',
      },
    ],
    plugins: [terser()],
  },
];
