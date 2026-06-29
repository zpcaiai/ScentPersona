import { View, Text, Button, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { PRODUCTS } from "../../data/products";
import { SITE_COPY } from "../../data/copy";
import { formatPrice } from "../../lib/utils";
import { assetUrl } from "../../lib/request";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

export default function Products() {
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
        <Text className="products-title">{SITE_COPY.products.title}</Text>
        <Text className="products-subtitle">{SITE_COPY.products.subtitle}</Text>
      </View>

      {/* Offers */}
      <View className="card">
        <Image className="offer-img" src={assetUrl("/products/sample-set.jpg")} mode="aspectFill" />
        <Text className="offer-title">{SITE_COPY.products.primaryOfferTitle}</Text>
        <Text className="offer-desc">{SITE_COPY.products.primaryOfferDesc}</Text>
        <Text className="offer-price">{SITE_COPY.products.primaryOfferPrice}</Text>
        <Button
          className="btn-primary"
          onClick={() => goToCheckout("sample-set-3", PRODUCTS.slice(0, 3).map((p) => p.id), 2990)}
        >
          领取3支小样
        </Button>
      </View>

      <View className="card">
        <Image className="offer-img" src={assetUrl("/products/sample-set.jpg")} mode="aspectFill" />
        <Text className="offer-title">{SITE_COPY.products.secondaryOfferTitle}</Text>
        <Text className="offer-desc">{SITE_COPY.products.secondaryOfferDesc}</Text>
        <Text className="offer-price">{SITE_COPY.products.secondaryOfferPrice}</Text>
        <Button
          className="btn-primary"
          onClick={() => goToCheckout("sample-set-6", PRODUCTS.map((p) => p.id), 5900)}
        >
          领取6支小样
        </Button>
      </View>

      <View className="card">
        <Image className="offer-img" src={assetUrl("/products/gift-box.jpg")} mode="aspectFill" />
        <Text className="offer-title">{SITE_COPY.products.giftOfferTitle}</Text>
        <Text className="offer-desc">{SITE_COPY.products.giftOfferDesc}</Text>
        <Text className="offer-price">{SITE_COPY.products.giftOfferPrice}</Text>
        <Button
          className="btn-primary"
          onClick={() => goToCheckout("gift-box", PRODUCTS.map((p) => p.id), 9900)}
        >
          购买礼盒套装
        </Button>
      </View>

      {/* All products */}
      <Text className="section-title">全部香水</Text>
      {PRODUCTS.map((product) => (
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
              小样 ¥{formatPrice(product.price.sample || 0)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
