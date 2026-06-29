import PageShell from "@/components/layout/PageShell";

export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="prose prose-stone max-w-none py-8">
        <h1 className="text-2xl font-serif text-stone-800">隐私政策</h1>
        <div className="mt-6 grid gap-5 text-sm leading-relaxed text-stone-600">
          <p>
            ScentPersona 会收集你主动提交的问卷答案、推荐结果、订单信息和试香反馈，
            用于生成香氛推荐、处理订单、改进推荐质量和提供售后服务。
          </p>
          <p>
            订单相关信息包括姓名、手机号、收货地址、订单状态和支付状态。我们不会把这些信息出售给第三方。
          </p>
          <p>
            支付由对应平台或支付机构完成。我们只保存订单状态、交易号等履约必要信息，不保存银行卡或支付密码。
          </p>
          <p>
            问卷结果仅供香氛偏好参考和娱乐体验，不构成医疗、心理、诊断或治疗建议。
          </p>
          <p>
            如需查询、更正或删除数据，请通过数据删除页面提交请求，并提供能定位记录的信息。
          </p>
        </div>
      </article>
    </PageShell>
  );
}
