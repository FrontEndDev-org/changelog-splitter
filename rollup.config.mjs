import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' assert { type: 'json' };

/** @type {import('rollup').RollupOptions} */
export default {
  input: ['src/index.ts'],
  output: [
    {
      format: 'esm',
      dir: 'dist-mjs',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name].mjs',
      sourcemap: true,
    },
    {
      format: 'cjs',
      dir: 'dist-cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name].cjs',
      sourcemap: true,
    },
  ],
  external: Object.keys(pkg.dependencies),
  plugins: [
    nodeResolve(),
    replace({
      'process.env.PKG_NAME': JSON.stringify(pkg.name),
      'process.env.PKG_VERSION': JSON.stringify(pkg.version),
    }),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ],
};
