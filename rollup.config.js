import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';


export default {
    entry: 'src/GameMain.js',
    format: 'umd',
    moduleName: 'Squares',
    plugins: [ 
        resolve(),
        commonjs({
            include: ['node_modules/**', /qtek\/lib/]
        }),
        babel({
            exclude: 'node_modules/**' // only transpile our source code
        })
    ],
    dest: 'dist/squares.js'
  };