import { defineConfig } from "@tarojs/cli";
import devConfig from "./dev";
import prodConfig from "./prod";

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: "scentpersona-miniapp",
    date: "2026-1-1",
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    plugins: ["@tarojs/plugin-platform-xhs"],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: "react",
    compiler: "webpack5",
    cache: {
      enable: false,
    },
    prebundle: {
      enable: false,
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: "module",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
    h5: {
      publicPath: "/",
      staticDirectory: "static",
      output: {
        filename: "js/[name].[hash:8].js",
        chunkFilename: "js/[name].[chunkhash:8].js",
      },
      miniCssExtractPluginOption: {
        filename: "css/[name].[hash].css",
        chunkFilename: "css/[name].[chunkhash].css",
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: "module",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
    rn: {
      appName: "taroDemo",
      postcss: {
        cssModules: {
          enable: false,
        },
      },
    },
  };

  process.env.BROWSERSLIST_ENV = process.env.NODE_ENV;
  if (process.env.NODE_ENV === "development") {
    return merge({}, baseConfig, devConfig);
  }
  return merge({}, baseConfig, prodConfig);
});
