import { NextResponse } from "next/server";

type Axis = "S" | "X" | "M" | "E";

type Body = {
  answers: Record<string, number>; // questionId -> -2..2
  questions: { id: string; axis: Axis }[]; // 当前抽到的题（只需要 id+axis）
};

function axisPole(axis: Axis, axisValue100: number) {
  if (axis === "S") return axisValue100 >= 0 ? "O" : "F";
  if (axis === "X") return axisValue100 >= 0 ? "P" : "R";
  if (axis === "M") return axisValue100 >= 0 ? "U" : "N";
  return axisValue100 >= 0 ? "L" : "D";
}

function computeAxis(axis: Axis, qs: { id: string; axis: Axis }[], answers: Record<string, number>) {
  const axisQs = qs.filter((q) => q.axis === axis);
  const n = axisQs.length;
  const maxAbs = n * 2;

  let sum = 0;
  let absSum = 0;

  for (const q of axisQs) {
    const v = answers[q.id] ?? 0;
    sum += v;
    absSum += Math.abs(v);
  }

  const axisValue100 = maxAbs ? (sum / maxAbs) * 100 : 0;
  const polarizationIndex = maxAbs ? absSum / maxAbs : 0;

  return { n, sum, axisValue100, polarizationIndex };
}

function stabilityLabel(p: number) {
  if (p >= 0.85) return "极高单侧偏好";
  if (p >= 0.65) return "稳定偏向";
  if (p >= 0.4) return "高适应";
  return "高流动 / 未定型";
}

const ARCHETYPES: Record<
  string,
  { name: string; myth: string; animal: string; energy: string; business: string[]; examples: string[]; desc: string }
> = {
  OPUL: {
    name: "The Eternal Architect",
    myth: "创世神工匠 / 世界结构守护者",
    animal: "大象",
    energy: "恒定结构场",
    business: ["奢侈经典", "长周期产品体系", "高标准制造"],
    examples: ["Hermès", "Tadao Ando"],
    desc: "结构严密、表面克制、功能真实、时间耐受。你像在建一座城市：慢，但不塌；静，但很硬。",
  },
  OPUD: {
    name: "The Precision Futurist",
    myth: "时间工程师",
    animal: "猎鹰",
    energy: "高精度移动系统",
    business: ["高端科技", "工业未来设计"],
    examples: ["Apple", "Jony Ive"],
    desc: "你爱的是速度与精度：干净的界面、利落的轮廓、极简但锋利的执行力。",
  },
  OPNL: {
    name: "The Sacred Minimalist",
    myth: "神殿守护者",
    animal: "白鹤",
    energy: "精神秩序场",
    business: ["文化高端品牌", "美术馆级表达"],
    examples: ["Agnes Martin", "Isamu Noguchi"],
    desc: "你的极简不是冷，而是有精神重量：留白、克制、仪式般的清洁感。",
  },
  OPND: {
    name: "The Concept Director",
    myth: "预言记录者",
    animal: "雪豹",
    energy: "思想事件能量",
    business: ["概念时装", "文化趋势"],
    examples: ["Prada", "Raf Simons"],
    desc: "形式克制却能在关键处引爆概念：一句短句就能改变房间空气。",
  },
  ORUL: {
    name: "The Master Builder",
    myth: "文明建造者",
    animal: "野牛",
    energy: "厚重现实能量",
    business: ["高端制造", "材料与建筑"],
    examples: ["Bottega Veneta", "Peter Zumthor"],
    desc: "你爱厚实的好：材料真实、质地浓、工艺扎实，能摸到的可靠最动人。",
  },
  ORUD: {
    name: "The Performance Engineer",
    myth: "战场发明者",
    animal: "狼",
    energy: "运动结构能量",
    business: ["运动科技", "功能时装"],
    examples: ["Nike", "Arc’teryx"],
    desc: "你要性能：结构要动得起来，细节服务行动，像装备、像系统。",
  },
  ORNL: {
    name: "The Cultural Archivist",
    myth: "文明记忆守护者",
    animal: "猫头鹰",
    energy: "时间沉积能量",
    business: ["文化品牌", "传统工艺高端化"],
    examples: ["Dries Van Noten", "Anselm Kiefer"],
    desc: "你爱沉积的丰富：纹理里有时间，细节里有历史，手艺与文化有重量。",
  },
  ORND: {
    name: "The Myth System Designer",
    myth: "世界观建构者",
    animal: "凤凰",
    energy: "文明叙事能量",
    business: ["文化IP", "高概念品牌"],
    examples: ["Alexander McQueen", "Balenciaga"],
    desc: "你喜欢把审美做成宇宙：符号密、叙事强、细节像考古，能自成世界。",
  },
  FPUL: {
    name: "The Quiet Optimizer",
    myth: "自然秩序观察者",
    animal: "鹿",
    energy: "自然稳定流",
    business: ["极简生活方式", "可持续", "轻量科技"],
    examples: ["Muji", "Jasper Morrison"],
    desc: "你要的轻不是空，而是顺：舒适、无负担、让生活更好用更好呼吸。",
  },
  FPUD: {
    name: "The Agile Minimalist",
    myth: "风之旅人",
    animal: "燕子",
    energy: "轻量移动能量",
    business: ["数字游牧产品", "轻量科技"],
    examples: ["Patagonia"],
    desc: "你爱轻装上阵：能带着走、能快速切换但仍干净，机动性是审美核心。",
  },
  FPNL: {
    name: "The Spiritual Wanderer",
    myth: "隐士 / 朝圣者",
    animal: "鲸",
    energy: "深时间精神能量",
    business: ["精神生活品牌", "艺术哲学"],
    examples: ["Mark Rothko"],
    desc: "安静但很深：不靠刺激取胜，靠持续的精神浓度慢慢渗透。",
  },
  FPND: {
    name: "The Vision Channel",
    myth: "先知 / 梦境传递者",
    animal: "蝴蝶",
    energy: "灵感事件能量",
    business: ["趋势文化", "数字艺术"],
    examples: ["Yayoi Kusama"],
    desc: "你像在接收信号：灵感来时像梦一样清晰，轻，但会突然改变你。",
  },
  FRUL: {
    name: "The Sensory Grounder",
    myth: "土地守护者",
    animal: "熊",
    energy: "现实存在能量",
    business: ["手工生活方式", "家居/香氛"],
    examples: ["Aesop"],
    desc: "你爱真实触感：温度、颗粒、气味、手工痕迹——把人拉回地面。",
  },
  FRUD: {
    name: "The Experience Builder",
    myth: "节庆创造者",
    animal: "海豚",
    energy: "体验事件能量",
    business: ["娱乐体验", "新零售"],
    examples: ["Disney"],
    desc: "你爱现场：可参与、可互动、可制造记忆，氛围与事件感就是美。",
  },
  FRNL: {
    name: "The Story World Keeper",
    myth: "部落历史讲述者",
    animal: "马",
    energy: "文化传承能量",
    business: ["文化内容品牌", "出版/文化IP"],
    examples: ["Gucci"],
    desc: "你要的是传承线：符号与传统连接成故事，越讲越厚、越讲越有人。",
  },
  FRND: {
    name: "The Reality Composer",
    myth: "混沌诗人",
    animal: "乌鸦",
    energy: "现实生成能量",
    business: ["前沿文化", "新媒体艺术"],
    examples: ["Björk"],
    desc: "你喜欢把现实重新编曲：拼贴、转化、混合，复杂是你生成意义的方式。",
  },
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const S = computeAxis("S", body.questions, body.answers);
  const X = computeAxis("X", body.questions, body.answers);
  const M = computeAxis("M", body.questions, body.answers);
  const E = computeAxis("E", body.questions, body.answers);

  const code =
    axisPole("S", S.axisValue100) +
    axisPole("X", X.axisValue100) +
    axisPole("M", M.axisValue100) +
    axisPole("E", E.axisValue100);

  const archetype = ARCHETYPES[code] ?? null;

  return NextResponse.json({
    code,
    axes: {
      S: { ...S, label: stabilityLabel(S.polarizationIndex) },
      X: { ...X, label: stabilityLabel(X.polarizationIndex) },
      M: { ...M, label: stabilityLabel(M.polarizationIndex) },
      E: { ...E, label: stabilityLabel(E.polarizationIndex) },
    },
    archetype,
  });
}
