import { View, Text, Button, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getProducts } from "../../data/products";
import { getSiteCopy } from "../../data/copy";
import { formatPrice } from "../../lib/utils";
import { assetUrl } from "../../lib/request";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

export default function Products() {
  const { locale } = useLang();
  useNavTitle("小样套装", "Sample kits");
  const copy = getSiteCopy(locale);
  const products = getProducts(locale);

  const goToDetail = (slug: string) => {
    Taro.navigateTo({ url: `/pages/product-detail/index?slug=${slug}` });
  };

  const goToCheckout = (type: string, ids: string[], price: number) => {
    Taro.navigateTo({
      url: `/pages/checkout/index?productType=${type}&productIds=${ids.join(",")}&price=${price}`,
    });
  };

  return (
    <View className={`products ${THEME_CLASS}`}>
      <View className="products-header">
        <Text className="products-title">{copy.products.title}</Text>
        <Text className="products-subtitle">{copy.products.subtitle}</Text>
      </View>

      {/* Offers */}
      <View className="card">
        <Image className="offer-img" src={assetUrl("/products/sample-set.jpg")} mode="aspectFill" />
        <Text className="offer-title">{copy.products.primaryOfferTitle}</Text>
        <Text className="offer-desc">{copy.products.primaryOfferDesc}</Text>
        <Text className="offer-price">{copy.products.primaryOfferPrice}</Text>
        <Button
          className="btn-primary"
          onClick={() => goToCheckout("sample-set-3", products.slice(0, 3).map((p) => p.id), 2990)}
        >
          {pick(locale, "领取3支小样", "Get 3 samples")}
        </Button>
      </View>

      <View className="card">
        <Image className="offer-img" src={assetUrl("/products/sample-set.jpg")} mode="aspectFill" />
        <Text className="offer-title">{copy.products.secondaryOfferTitle}</Text>
        <Text className="offer-desc">{copy.products.secondaryOfferDesc}</Text>
        <Text className="offer-price">{copy.products.secondaryOfferPrice}</Text>
        <Button
          className="btn-primary"
          onClick={() => goToCheckout("sample-set-6", products.map((p) => p.id), 5900)}
        >
          {pick(locale, "领取6支小样", "Get 6 samples")}
        </Button>
      </View>

      <View className="card">
        <Image className="offer-img" src={assetUrl("/products/gift-box.jpg")} mode="aspectFill" />
        <Text className="offer-title">{copy.products.giftOfferTitle}</Text>
        <Text className="offer-desc">{copy.products.giftOfferDesc}</Text>
        <Text className="offer-price">{copy.products.giftOfferPrice}</Text>
        <Button
          className="btn-primary"
          onClick={() => goToCheckout("gift-box", products.map((p) => p.id), 9900)}
        >
          {pick(locale, "购买礼盒套装", "Buy gift box kit")}
        </Button>
      </View>

      {/* All products */}
      <Text className="section-title">{pick(locale, "全部香水", "All fragrances")}</Text>
      {products.map((product) => (
        <View
          key={product.id}
          className="product-card"
          onClick={() => goToDetail(product.slug)}
        >
          <Image className="product-card-img" src={assetUrl(product.image)} mode="aspectFill" />
          <Text className="product-name">{product.name}</Text>
          <Text className="product-desc">{product.plainDescription}</Text>
          <View className="product-footer">
            <View className="product-tags">
              {product.suitableFor.slice(0, 3).map((tag, i) => (
                <Text key={i} className="tag">{tag}</Text>
              ))}
            </View>
            <Text className="product-price">
              {pick(locale, "小样", "Sample")} ¥{formatPrice(product.price.sample || 0)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
