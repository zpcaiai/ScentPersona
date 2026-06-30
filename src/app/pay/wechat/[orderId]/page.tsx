import { db } from "@/lib/db";
import WechatQR from "@/components/WechatQR";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function WechatPayPage({ params }: { params: { orderId: string } }) {
  const locale = getLocale();
  const payment = await db.orderPayment.findFirst({
    where: { orderId: params.orderId, provider: "wechat" },
    orderBy: { createdAt: "desc" },
  });
  let codeUrl = "";
  if (payment?.rawDataJson) {
    try { codeUrl = (JSON.parse(payment.rawDataJson) as { clientSecret?: string }).clientSecret ?? ""; } catch { /* */ }
  }
  return (
    <main style={{ maxWidth: 420, margin: "8vh auto", padding: 24, fontFamily: "system-ui", textAlign: "center" }}>
      <h1 style={{ fontFamily: "Georgia, serif", color: "#556648", fontSize: 22 }}>{pick(locale, "微信扫码支付", "WeChat Pay (scan QR)")}</h1>
      <p style={{ color: "#6b6760", fontSize: 14 }}>{pick(locale, "请用微信扫描下方二维码完成支付，支付成功后本页会自动更新。", "Scan the QR code below with WeChat to pay. This page updates automatically once payment succeeds.")}</p>
      {codeUrl ? (
        <WechatQR text={codeUrl} orderId={params.orderId} />
      ) : (
        <p style={{ color: "#c0392b", marginTop: 16 }}>{pick(locale, "未找到支付二维码，请返回重新发起支付。", "Payment QR not found. Please go back and start payment again.")}</p>
      )}
    </main>
  );
}
