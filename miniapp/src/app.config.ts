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
    selectedColor: "#7c9070",
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
    navigationBarBackgroundColor: "#faf8f5",
    navigationBarTitleText: "ScentPersona",
    navigationBarTextStyle: "black",
  },
});
