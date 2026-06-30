import PageShell from "@/components/layout/PageShell";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export default function PrivacyPage() {
  const locale = getLocale();

  return (
    <PageShell>
      <article className="prose prose-stone max-w-none py-8">
        <h1 className="text-2xl font-serif text-stone-800">
          {pick(locale, "隐私政策", "Privacy Policy")}
        </h1>
        <div className="mt-6 grid gap-5 text-sm leading-relaxed text-stone-600">
          <p>
            {pick(
              locale,
              "ScentPersona 会收集你主动提交的问卷答案、推荐结果、订单信息和试香反馈，用于生成香氛推荐、处理订单、改进推荐质量和提供售后服务。",
              "ScentPersona collects the quiz answers, recommendation results, order details, and scent trial feedback you choose to submit, in order to generate fragrance recommendations, process orders, improve recommendation quality, and provide after-sales support."
            )}
          </p>
          <p>
            {pick(
              locale,
              "订单相关信息包括姓名、手机号、收货地址、订单状态和支付状态。我们不会把这些信息出售给第三方。",
              "Order-related information includes your name, phone number, shipping address, order status, and payment status. We never sell this information to third parties."
            )}
          </p>
          <p>
            {pick(
              locale,
              "支付由对应平台或支付机构完成。我们只保存订单状态、交易号等履约必要信息，不保存银行卡或支付密码。",
              "Payments are handled by the relevant platform or payment provider. We only keep the information needed to fulfill your order, such as order status and transaction numbers — never your card details or payment passwords."
            )}
          </p>
          <p>
            {pick(
              locale,
              "问卷结果仅供香氛偏好参考和娱乐体验，不构成医疗、心理、诊断或治疗建议。",
              "Quiz results are for fragrance preference guidance and entertainment only, and do not constitute medical, psychological, diagnostic, or treatment advice."
            )}
          </p>
          <p>
            {pick(
              locale,
              "如需查询、更正或删除数据，请通过数据删除页面提交请求，并提供能定位记录的信息。",
              "To access, correct, or delete your data, submit a request via the Data Deletion page and provide information that lets us locate your records."
            )}
          </p>
        </div>
      </article>
    </PageShell>
  );
}
