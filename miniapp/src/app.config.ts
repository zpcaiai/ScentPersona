const isXhs = process.env.TARO_ENV === "xhs";
const brandSelected = isXhs ? "#ff2e4d" : "#7c9070";
const barBg = isXhs ? "#fff7f4" : "#faf8f5";

export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/quiz/index",
    "pages/result/index",
    "pages/products/index",
    "pages/product-detail/index",
    "pages/checkout/index",
    "pages/orders/index",
    "pages/order-detail/index",
    "pages/feedback/index",
    "pages/profile/index",
    "pages/privacy/index",
  ],
  tabBar: {
    color: "#9a948c",
    selectedColor: brandSelected,
    backgroundColor: "#ffffff",
    borderStyle: "white",
    list: [
      { pagePath: "pages/index/index", text: "首页" },
      { pagePath: "pages/products/index", text: "产品" },
      { pagePath: "pages/orders/index", text: "订单" },
      { pagePath: "pages/profile/index", text: "我的" },
    ],
  },
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: barBg,
    navigationBarTitleText: "ScentPersona",
    navigationBarTextStyle: "black",
    backgroundColor: barBg,
  },
});
