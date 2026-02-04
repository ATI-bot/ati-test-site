"use client";

import React, { useEffect, useMemo, useState } from "react";
import HomeButton from "../components/HomeButton";

import zhPool from "../questions_zh.json";
import enPool from "../questions_en.json";

type Axis = "S" | "X" | "M" | "E";
type Q = { id: string; axis: Axis; text: string };

export default function ResultFreePage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [tier, setTier] = useState<"free" | "full">("free");
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    const lg = (sessionStorage.getItem("ati_lang") as any) || "zh";
    const tr = (sessionStorage.getItem("ati_tier") as any) || "free";
    setLang(lg === "en" ? "en" : "zh");
    setTier(tr === "full" ? "full" : "free");

    const answersRaw = sessionStorage.getItem("ati_answers");
    const answers = answersRaw ? JSON.parse(answersRaw) : {};

    // 拿到本轮抽题 ids（防止你以后扩展题库时算错维度）
    const ssKey = `ati_run_${lg}_${tr}`;
    const runRaw = sessionStorage.getItem(ssKey);
    const run = runRaw ? JSON.parse(runRaw) : null;
    const qIds: string[] = run?.qIds || [];

    const pool = ((lg === "en" ? enPool : zhPool) as Q[]) as Q[];
    const map = new Map(pool.map((q) => [q.id, q]));

    const questions = qIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((q) => ({ id: q!.id, axis: q!.axis }));

    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, questions }),
    })
      .then((r) => r.json())
      .then((d) => setPayload(d))
      .catch(() => setPayload({ error: true }));
  }, []);

  const title = useMemo(() => {
    if (lang === "en") return tier === "full" ? "Your Result (Full)" : "Your Result (Free)";
    return tier === "full" ? "你的结果（完整版）" : "你的结果（免费版）";
  }, [lang, tier]);

  if (!mounted) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!payload) return <div style={{ padding: 24 }}>{lang === "en" ? "Scoring…" : "正在计算…"}</div>;

  if (payload.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-xl space-y-4">
          <HomeButton />
          <div className="text-lg font-semibold">{lang === "en" ? "Error" : "出错了"}</div>
          <div className="text-gray-600">
            {lang === "en" ? "Please restart the test." : "请返回重新开始测试。"}
          </div>
        </div>
      </div>
    );
  }

  const a = payload.archetype;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <HomeButton />
          <button
            onClick={() => {
              // 清掉本轮缓存，回测试页
              sessionStorage.removeItem("ati_answers");
              window.location.href = `/test?lang=${lang}&tier=${tier}`;
            }}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            {lang === "en" ? "Retake" : "重新测试"}
          </button>
        </div>

        <h1 className="text-2xl font-semibold">{title}</h1>

        <div className="p-5 rounded-2xl border">
          <div className="text-sm text-gray-500 mb-2">
            {lang === "en" ? "Type Code" : "类型编码"}
          </div>
          <div className="text-3xl font-bold">{payload.code}</div>
        </div>

        {a && (
          <div className="p-5 rounded-2xl border space-y-3">
            <div className="text-xl font-semibold">{a.name}</div>
            <div className="text-gray-700 leading-relaxed">{a.desc}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-gray-50">
                <div className="text-sm text-gray-500">{lang === "en" ? "Myth" : "神话原型"}</div>
                <div className="font-medium">{a.myth}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <div className="text-sm text-gray-500">{lang === "en" ? "Animal" : "动物意象"}</div>
                <div className="font-medium">{a.animal}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <div className="text-sm text-gray-500">{lang === "en" ? "Energy" : "能量"}</div>
                <div className="font-medium">{a.energy}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <div className="text-sm text-gray-500">{lang === "en" ? "Examples" : "例子"}</div>
                <div className="font-medium">{(a.examples || []).join(" / ")}</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 rounded-2xl border">
          <div className="text-sm text-gray-500 mb-3">
            {lang === "en" ? "Axis Summary" : "四维摘要"}
          </div>

          <div className="space-y-2 text-gray-700">
            {(["S", "X", "M", "E"] as Axis[]).map((k) => (
              <div key={k} className="flex justify-between">
                <div>
                  <span className="font-semibold">{k}</span>{" "}
                  <span className="text-gray-500">({payload.axes?.[k]?.label})</span>
                </div>
                <div className="font-medium">{Math.round(payload.axes?.[k]?.axisValue100 || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
