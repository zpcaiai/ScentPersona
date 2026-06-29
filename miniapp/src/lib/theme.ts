// 平台主题：编译期由 Taro 注入 process.env.TARO_ENV
export const IS_XHS = process.env.TARO_ENV === "xhs";
export const THEME_CLASS = IS_XHS ? "theme-xhs" : "theme-weapp";
