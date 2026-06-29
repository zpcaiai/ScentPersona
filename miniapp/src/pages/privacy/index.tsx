import { View, Text } from "@tarojs/components";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

const CONTACT_EMAIL = "zpchoney@gmail.com";
const UPDATED = "2026年6月";

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "引言",
    paragraphs: [
      "ScentPersona 团队（以下简称“我们”）非常重视你的隐私。本政策说明在你使用 ScentPersona 微信／小红书小程序及相关服务时，我们如何收集、使用、存储和保护你的个人信息。",
      "当你使用我们的服务，即表示你已阅读并同意本政策。",
    ],
  },
  {
    title: "我们收集的信息",
    paragraphs: [
      "测验信息：你在气味人格测验中选择的答案，用于生成人格报告与香氛推荐。",
      "订单与收货信息：当你下单时收集的收货人姓名、手机号、收货地址及订单备注。",
      "支付相关信息：为完成支付，微信／小红书会处理必要的支付凭证；我们不存储你的银行卡或支付密码。",
      "反馈信息：你主动提交的试香评分与文字反馈。",
      "设备与本地缓存：为维持登录与下单体验，小程序会在本地缓存会话标识（如微信 openid）、订单访问令牌与你绑定的手机号。",
    ],
  },
  {
    title: "信息如何使用",
    paragraphs: [
      "生成你的气味人格报告与个性化推荐；",
      "创建并履行订单、安排发货、提供售后；",
      "在你同意的前提下改进产品与推荐算法；",
      "保障账户与交易安全、防范欺诈。",
    ],
  },
  {
    title: "信息共享",
    paragraphs: [
      "支付服务：下单支付时，相关订单信息会传输给微信支付或小红书支付以完成交易。",
      "我们不会出售你的个人信息。仅在法律法规要求、或为完成你请求的服务所必需时，才会共享必要信息。",
    ],
  },
  {
    title: "存储与安全",
    paragraphs: [
      "数据通过加密通道传输，并存储在受访问控制保护的数据库中。",
      "我们仅在实现上述目的所必需的期间内保留你的信息；超出期限或你请求删除后，我们将删除或匿名化处理。",
    ],
  },
  {
    title: "你的权利",
    paragraphs: [
      "你有权查询、更正或删除你的个人信息。",
      `如需删除数据，可在小程序内联系我们，或发送邮件至 ${CONTACT_EMAIL}，我们将在合理期限内处理。`,
    ],
  },
  {
    title: "未成年人",
    paragraphs: [
      "我们的服务面向成年人。若你是未成年人，请在监护人指导下使用，并在监护人同意后提供个人信息。",
    ],
  },
  {
    title: "政策更新",
    paragraphs: [
      "我们可能适时更新本政策。重大变更将通过小程序内显著方式提示。继续使用即表示接受更新后的政策。",
    ],
  },
  {
    title: "联系我们",
    paragraphs: [
      `如对本隐私政策有任何疑问，请联系：${CONTACT_EMAIL}`,
    ],
  },
];

export default function Privacy() {
  return (
    <View className={`privacy ${THEME_CLASS}`}>
      <View className="privacy-header">
        <Text className="privacy-title">隐私政策</Text>
        <Text className="privacy-updated">最近更新：{UPDATED}</Text>
      </View>
      {SECTIONS.map((sec, i) => (
        <View key={i} className="card privacy-section">
          <Text className="privacy-section-title">{sec.title}</Text>
          {sec.paragraphs.map((p, j) => (
            <Text key={j} className="privacy-paragraph">{p}</Text>
          ))}
        </View>
      ))}
      <View className="privacy-footer">
        <Text className="text-muted">ScentPersona 团队</Text>
      </View>
    </View>
  );
}
