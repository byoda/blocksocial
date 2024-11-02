import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import preprocess from "svelte-preprocess";
import postcss from "rollup-plugin-postcss";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import os from "os";
import fs from "fs";

import nodePolyfills from 'rollup-plugin-polyfill-node';

// import { sveltePreprocess } from 'svelte-preprocess'

// const production = !process.env.ROLLUP_WATCH;
// const buildEnv = process.env.BUILD_ENV;
const production = false;
const buildEnv = "chrome";

function buildConfig(inputFileName, outputFileName) {
    return {
        input: `src/${inputFileName}.ts`,
        output: {
            file: `public/build/${outputFileName}.js`,
            format: "iife",
            name: "app",
            sourcemap: !production,
        },
        plugins: [
            svelte(
                {
                    compilerOptions: {
                      dev: !production,
                    },
                    // sveltePreprocess fails to build .svelte files so we
                    // use the deprecated preprocess instead
                    // preprocess: sveltePreprocess(
                    preprocess: preprocess(
                        {
                            typescript: {
                                tsconfigFile: "./tsconfig.app.json",
                            },
                            postcss: {
                              plugins: [tailwindcss, autoprefixer],
                          },
                        }
                    ),
                }
            ),
            postcss(
                {
                    extract: `${outputFileName}.css`,
                    minimize: production,
                    sourceMap: !production,
                    config: {
                        path: "./postcss.config.cjs",
                    },
                }
            ),
            typescript({ sourceMap: !production, tsconfig: "./tsconfig.app.json" }),
            resolve({ browser: true }),
            commonjs(),
            serve(),
            // nodePolyfills is needed to prevent failure transpiling
            // ByoList.from_file()
            nodePolyfills(),
        ],
        watch: {
            clearScreen: false,
        },
    };
}

export default [
    buildConfig("popup", "popup"),
    buildConfig("config", "config"),
    buildConfig("listview", "listview"),
    {
        input: "src/worker/worker.ts",
        output: {
            format: buildEnv === 'firefox' ? 'iife' : 'es',
            name: "service_worker",
            file: "public/build/worker.js",
            sourcemap: !production,
        },
        plugins: [
            typescript(
                {
                    tsconfig: "./tsconfig.worker.json",
                    sourceMap: !production,
                }
            ),
            commonjs(),
            resolve(
                {
                    browser: true,
                    preferBuiltins: false
                }
            ),
        ],
        watch: {
            clearScreen: false,
        },
    },
//     {
//       input: "src/X/block.ts",
//       output: {
//           format: buildEnv === 'firefox' ? 'iife' : 'es',
//           name: "block_x",
//           file: "public/build/block_x.js",
//           sourcemap: !production,
//       },
//       plugins: [
//           typescript(
//               {
//                   tsconfig: "./tsconfig.worker.json",
//                   sourceMap: !production,
//               }
//           ),
//           commonjs(),
//           resolve(
//             {
//                 browser: true,
//                 preferBuiltins: false }
//           ),
//       ],
//       watch: {
//           clearScreen: false,
//       },
//     }
];