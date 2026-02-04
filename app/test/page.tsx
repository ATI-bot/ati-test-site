"use client";
console.log("ZH pool size:", (zhPool as any[])?.length);
console.log("EN pool size:", (enPool as any[])?.length);

import React, { useEffect, useMemo, useState } from "react";
import HomeButton from "../components/HomeButton";

// 题库：你已有 data/questions_zh.json / questions_en.json
import zhPool from "../../data/questions_zh.json";
import enPool from "../../data/questions_en.json";


type Axis = "S" | "X" | "M" | "E";
type Tier = "free" | "full";

type Q = { id: string; axis: Axis; text: string };
type Answer = { questionId: string; value: number }; // -2..2

// ✅ 五选项：值固定，但显示顺序会随机（满足“选择顺序不一样”）
const BASE_OPTIONS = [
  { labelZh: "非常同意", labelEn: "Strongly agree", value: 2 },
  { labelZh: "有些同意", labelEn: "Somewhat agree", value: 1 },
  { labelZh: "无感", labelEn: "Neutral", value: 0 },
  { labelZh: "有些不同意", labelEn: "Somewhat disagree", value: -1 },
  { labelZh: "非常不同意", labelEn: "Strongly disagree", value: -2 },
] as const;

// ===== helpers =====
function getSearchParam(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = new URLSearchParams(window.location.search).get(key);
  return v ?? fallback;
}

// 稳定 shuffle（给定 seed 同一次测试保持一致）
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr];
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickByAxis(pool: Q[], axis: Axis, count: number, seed: number) {
  const candidates = pool.filter((q) => q.axis === axis);
  const shuffled = shuffle(candidates, seed);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// 你的付费解锁逻辑（你项目里应该已有）
function isUnlockedFull() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ati_full_unlocked") === "1";
}

// 每次开始测试：生成一个 runKey，保证“每次测试都不同”
function newRunKey() {
  // 随机 32bit
  const x = new Uint32Array(1);
  crypto.getRandomValues(x);
  return x[0].toString(16);
}

export default function TestPage() {
  // ✅ 防 hydration mismatch：等 mounted 再读 URL / storage
  const [mounted, setMounted] = useState(false);

  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [tier, setTier] = useState<Tier>("free");

  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [runKey, setRunKey] = useState<string>("");

  useEffect(() => {
    setMounted(true);

    const lg = getSearchParam("lang", "zh") === "en" ? "en" : "zh";
    const tr: Tier = getSearchParam("tier", "free") === "full" ? "full" : "free";

    // 未解锁强制去 pay
    if (tr === "full" && !isUnlockedFull()) {
      window.location.replace(`/pay?lang=${lg}`);
      return;
    }

    setLang(lg);
    setTier(tr);

    // ====== 从 sessionStorage 读取本轮测试（防中途刷新变题）======
    const ssKey = `ati_run_${lg}_${tr}`;
    const saved = sessionStorage.getItem(ssKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          runKey: string;
          qIds: string[];
          answers: Record<string, number>;
          index: number;
        };
        setRunKey(parsed.runKey);
        setAnswers(parsed.answers || {});
        setIndex(parsed.index || 0);

        const pool = (lg === "en" ? (enPool as Q[]) : (zhPool as Q[])) as Q[];
        const map = new Map(pool.map((q) => [q.id, q]));
        const qs = parsed.qIds.map((id) => map.get(id)).filter(Boolean) as Q[];
        setQuestions(qs);

        return;
      } catch {
        // fallthrough to regenerate
      }
    }

    // ====== 新开一轮测试：抽题 + 随机顺序 ======
    const pool = (lg === "en" ? (enPool as Q[]) : (zhPool as Q[])) as Q[];

    const rk = newRunKey();
    setRunKey(rk);

    // 抽题配额：free(3维*5) / full(4维*11)
    const counts =
      tr === "full"
        ? ({ S: 11, X: 11, M: 11, E: 11 } as const)
        : ({ S: 5, X: 5, M: 5 } as const);

    const seedBase = parseInt(rk, 16) || 123456;

    const picked: Q[] = [];
    picked.push(...pickByAxis(pool, "S", counts.S, seedBase + 11));
    picked.push(...pickByAxis(pool, "X", counts.X, seedBase + 22));
    picked.push(...pickByAxis(pool, "M", counts.M, seedBase + 33));
    if (tr === "full") {
      picked.push(...pickByAxis(pool, "E", 11, seedBase + 44));
    }

    // 题目顺序随机
    const randomized = shuffle(picked, seedBase + 99);

    setQuestions(randomized);
    setAnswers({});
    setIndex(0);

    sessionStorage.setItem(
      ssKey,
      JSON.stringify({
        runKey: rk,
        qIds: randomized.map((q) => q.id),
        answers: {},
        index: 0,
      })
    );
  }, []);

  // 每次答题后保存进 sessionStorage
  useEffect(() => {
    if (!mounted) return;
    const ssKey = `ati_run_${lang}_${tier}`;
    if (!runKey || questions.length === 0) return;

    sessionStorage.setItem(
      ssKey,
      JSON.stringify({
        runKey,
        qIds: questions.map((q) => q.id),
        answers,
        index,
      })
    );
  }, [mounted, lang, tier, runKey, questions, answers, index]);

  const total = questions.length;
  const current = questions[index];

  const progress = useMemo(() => {
    if (!total) return 0;
    return Math.round(((index + 1) / total) * 100);
  }, [index, total]);

  // ✅ 当前题的选项顺序也随机：同一轮测试固定、不同轮不同
  const options = useMemo(() => {
    const seed = (parseInt(runKey || "0", 16) || 1) + index * 101;
    const arr = BASE_OPTIONS.map((o) => ({
      label: lang === "en" ? o.labelEn : o.labelZh,
      value: o.value,
    }));
    return shuffle(arr, seed);
  }, [lang, runKey, index]);

  function choose(v: number) {
    if (!current) return;
    const next = { ...answers, [current.id]: v };
    setAnswers(next);

    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      // 提交去算分（走 API，统一返回结果）
      // 免费结果页：/result-free
      // 完整版你可做 /result-full（现在先复用 free 页也行）
      sessionStorage.setItem("ati_answers", JSON.stringify(next));
      sessionStorage.setItem("ati_lang", lang);
      sessionStorage.setItem("ati_tier", tier);
      window.location.href = "/result-free";
    }
  }

  function restart() {
    // 清掉本轮
    const ssKey = `ati_run_${lang}_${tier}`;
    sessionStorage.removeItem(ssKey);
    window.location.reload();
  }

  if (!mounted) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-xl space-y-4">
          <div className="text-center text-gray-600">
            {lang === "en" ? "Preparing questions…" : "正在生成题目…"}
          </div>
          <div className="flex justify-center gap-3">
            <HomeButton />
            <button
              onClick={restart}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              {lang === "en" ? "Regenerate" : "重新抽题"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* 顶部按钮 */}
        <div className="flex items-center justify-between">
          <HomeButton />
          <button
            onClick={restart}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            {lang === "en" ? "Restart" : "重新开始"}
          </button>
        </div>

        {/* 进度 */}
        <div>
          <div className="text-sm text-gray-500 mb-2">
            {lang === "en" ? `${progress}% Complete` : `${progress}% 完成`}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-gray-900" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 题干 */}
        <div className="text-xl font-semibold leading-relaxed">
          {current.text}
        </div>

        {/* 选项（顺序随机） */}
        <div className="space-y-3">
          {options.map((o) => (
            <button
              key={`${current.id}_${o.value}`}
              onClick={() => choose(o.value)}
              className="w-full text-left px-5 py-4 rounded-2xl border hover:bg-gray-50 transition"
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* 底部：上一题 */}
        <div className="flex justify-between text-sm text-gray-500">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="disabled:opacity-30"
          >
            {lang === "en" ? "← Back" : "← 上一题"}
          </button>

          <div>
            {index + 1}/{total}
          </div>
        </div>
      </div>
    </div>
  );
}
