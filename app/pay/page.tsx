"use client";

import { useEffect, useState } from "react";

function getParam(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

export default function PayPage() {
  const [lang, setLang] = useState<"zh" | "en">("zh");

  useEffect(() => {
    const lg = getParam("lang", "zh") === "en" ? "en" : "zh";
    setLang(lg as "zh" | "en");
  }, []);

  // ✅ 把下面三条替换为你 Stripe Payment Link 的真实链接
  const link299 = "https://buy.stripe.com/6oUfZh4Mw9bs8iy9XtcMM00";
  const link1999 = "https://buy.stripe.com/9B6bJ1en6gDU8iyfhNcMM01";
  const link2999 = "https://buy.stripe.com/3cIcN57YI2N442i2v1cMM02";

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold">
          {lang === "en" ? "Unlock ATI" : "解锁 ATI"}
        </h1>

        <div className="p-4 border rounded-xl space-y-3">
          <div className="font-medium">
            {lang === "en" ? "$2.99 — Full Questions + Basic Analysis" : "2.99 美元 — 解锁完整版题目 + 完整版简易分析"}
          </div>
          <a
            className="inline-block border rounded-xl px-4 py-3 hover:bg-gray-100"
            href={link299}
            target="_blank"
            rel="noreferrer"
          >
            {lang === "en" ? "Pay $2.99" : "支付 2.99"}
          </a>
        </div>

        <div className="p-4 border rounded-xl space-y-3">
          <div className="font-medium">
            {lang === "en" ? "$19.99 — Full Analysis Pack" : "19.99 美元 — 解锁完整版全套分析"}
          </div>
          <a
            className="inline-block border rounded-xl px-4 py-3 hover:bg-gray-100"
            href={link1999}
            target="_blank"
            rel="noreferrer"
          >
            {lang === "en" ? "Pay $19.99" : "支付 19.99"}
          </a>
        </div>

        <div className="p-4 border rounded-xl space-y-3">
          <div className="font-medium">
            {lang === "en" ? "$29.99 — Custom Report (Fill details)" : "29.99 美元 — 个人定制报告（需要填写详细信息）"}
          </div>
          <a
            className="inline-block border rounded-xl px-4 py-3 hover:bg-gray-100"
            href={link2999}
            target="_blank"
            rel="noreferrer"
          >
            {lang === "en" ? "Pay $29.99" : "支付 29.99"}
          </a>
        </div>

        <div className="text-sm text-gray-500">
          {lang === "en"
            ? "After payment, Stripe will redirect you back and unlock your tier."
            : "支付完成后 Stripe 会跳回本站并自动解锁对应版本。"}
        </div>

        <div className="text-sm text-gray-500">
          <a className="underline mr-3" href={`/test?lang=${lang}&tier=free`}>
            {lang === "en" ? "Back to Free" : "返回免费版"}
          </a>
          <a className="underline" href={`/test?lang=${lang}&tier=full`}>
            {lang === "en" ? "Go to Full Test" : "去完整版测试"}
          </a>
        </div>
      </div>
    </div>
  );
}
