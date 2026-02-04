"use client";

import { useEffect, useState } from "react";

type Tier = "full_basic" | "full_analysis" | "custom";

function getParam(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

export default function PaySuccessPage() {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [tier, setTier] = useState<Tier>("full_basic");

  useEffect(() => {
    const lg = (getParam("lang", "zh") === "en" ? "en" : "zh") as "zh" | "en";
    const tr = getParam("tier", "full_basic") as Tier;

    setLang(lg);
    setTier(tr);

    // ✅ MVP：直接写入本地权限（之后可升级：登录+数据库+webhook）
    if (tr === "full_basic") {
      localStorage.setItem("ati_unlocked_full", "1"); // 允许 full 题库
      localStorage.setItem("ati_entitlement", "full_basic");
    }
    if (tr === "full_analysis") {
      localStorage.setItem("ati_unlocked_full", "1");
      localStorage.setItem("ati_entitlement", "full_analysis");
    }
    if (tr === "custom") {
      localStorage.setItem("ati_unlocked_full", "1");
      localStorage.setItem("ati_entitlement", "custom");
    }
  }, []);

  const title =
    lang === "en" ? "Payment successful" : "支付成功";

  const desc =
    tier === "full_basic"
      ? lang === "en"
        ? "Full questions unlocked."
        : "已解锁完整版题目。"
      : tier === "full_analysis"
      ? lang === "en"
        ? "Full analysis unlocked."
        : "已解锁完整版全套分析。"
      : lang === "en"
      ? "Custom report unlocked. Please fill out the form."
      : "已解锁个人定制报告，请填写信息表。";

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-5">
        <h1 className="text-2xl font-semibold">✅ {title}</h1>
        <div className="p-4 border rounded-xl">{desc}</div>

        <div className="space-y-2">
          <a className="underline block" href={`/test?lang=${lang}&tier=full`}>
            {lang === "en" ? "Go to Full Test" : "去做完整版测试"}
          </a>

          {tier === "custom" && (
            <a className="underline block" href={`/custom?lang=${lang}`}>
              {lang === "en" ? "Fill Custom Report Form" : "填写定制报告信息表"}
            </a>
          )}

          <a className="underline block" href={`/test?lang=${lang}&tier=free`}>
            {lang === "en" ? "Back to Free" : "返回免费版"}
          </a>
        </div>

        <div className="text-sm text-gray-500">
          MVP 提示：目前用本地权限解锁；上线后我会带你升级成“登录 + Stripe webhook 防盗刷”。
        </div>
      </div>
    </div>
  );
}
