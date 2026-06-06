const dimensions = [
  {
    key: "positioning",
    name: "定位力",
    description: "客户是否清楚你是谁、服务谁、解决什么问题。"
  },
  {
    key: "product",
    name: "产品力",
    description: "是否有清晰的产品阶梯、价格锚点和交付边界。"
  },
  {
    key: "marketing",
    name: "营销力",
    description: "是否能持续输出吸引精准客户的内容。"
  },
  {
    key: "closing",
    name: "成交力",
    description: "是否有私聊转化、需求诊断、异议处理和逼单能力。"
  }
];

const questions = [
  { id: "p1", dimension: "positioning", text: "我能用一句话讲清楚自己服务哪类客户。" },
  { id: "p2", dimension: "positioning", text: "客户能快速理解我提供的核心价值。" },
  { id: "p3", dimension: "positioning", text: "我的IP标签和同行相比有明显差异。" },
  { id: "p4", dimension: "positioning", text: "我知道目标客户最想解决的商业问题。" },
  { id: "pr1", dimension: "product", text: "我有清晰的入门、进阶和高客单产品。" },
  { id: "pr2", dimension: "product", text: "我的产品价格和交付内容边界明确。" },
  { id: "pr3", dimension: "product", text: "客户能看懂购买后可以获得什么结果。" },
  { id: "pr4", dimension: "product", text: "我的产品能承接不同阶段客户的需求。" },
  { id: "m1", dimension: "marketing", text: "我能持续输出让精准客户产生兴趣的内容。" },
  { id: "m2", dimension: "marketing", text: "我的内容能体现专业度、案例和方法论。" },
  { id: "m3", dimension: "marketing", text: "我有稳定的私域获客渠道或转介绍来源。" },
  { id: "m4", dimension: "marketing", text: "我知道如何把内容流量导入私域沟通。" },
  { id: "c1", dimension: "closing", text: "我能通过私聊判断客户真实需求和预算。" },
  { id: "c2", dimension: "closing", text: "我有标准的成交沟通流程和跟进节奏。" },
  { id: "c3", dimension: "closing", text: "我能处理客户常见的价格、信任和效果异议。" },
  { id: "c4", dimension: "closing", text: "我能在合适时机推动客户做购买决策。" }
];

const levels = [
  { min: 90, name: "高转化型IP", summary: "你的商业变现能力已经较成熟，重点是复制成功路径、扩大流量入口和提升高客单成交效率。" },
  { min: 75, name: "增长突破型IP", summary: "你已经具备变现基础，下一步要补齐短板维度，让定位、产品、营销和成交形成闭环。" },
  { min: 60, name: "基础成型型IP", summary: "你的IP商业化框架初步成型，但稳定变现能力还需要进一步打磨。" },
  { min: 40, name: "变现卡点型IP", summary: "你已经开始尝试变现，但核心链路存在明显卡点，需要优先找到影响成交的关键问题。" },
  { min: 0, name: "商业定位待重构型IP", summary: "当前更适合先重构定位和产品表达，再进入营销放大和成交转化。" }
];

const advice = {
  positioning: "优先梳理目标客户、核心痛点和差异化标签，把你的价值浓缩成客户一听就懂的一句话。",
  product: "重做产品阶梯和价格锚点，明确每个产品解决什么问题、交付什么结果、适合哪类客户。",
  marketing: "建立固定内容栏目，把案例、方法论、客户痛点和成交故事持续输出到私域入口。",
  closing: "设计私聊诊断流程，准备高频异议回应话术，并建立跟进节奏推动客户决策。"
};

function getLevel(totalScore) {
  return levels.find((level) => totalScore >= level.min) || levels[levels.length - 1];
}

function scoreAssessment(answers) {
  const dimensionScores = dimensions.map((dimension) => {
    const relatedQuestions = questions.filter((question) => question.dimension === dimension.key);
    const raw = relatedQuestions.reduce((sum, question) => sum + Number(answers[question.id] || 0), 0);

    return {
      key: dimension.key,
      name: dimension.name,
      description: dimension.description,
      raw,
      score: Math.round((raw / 20) * 100)
    };
  });

  const totalRaw = dimensionScores.reduce((sum, dimension) => sum + dimension.raw, 0);
  const totalScore = Math.round((totalRaw / 80) * 100);
  const level = getLevel(totalScore);
  const sorted = [...dimensionScores].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return {
    totalScore,
    level,
    dimensionScores,
    strongest,
    weakest,
    simpleAdvice: [
      `当前优势是${strongest.name}，可以把这部分变成你的对外表达亮点。`,
      `当前短板是${weakest.name}，建议优先优化：${advice[weakest.key]}`,
      "完整报告请咨询顾问领取，结合你的行业和客单价制定具体变现路径。"
    ],
    fullReport: buildFullReport(totalScore, level, dimensionScores, strongest, weakest)
  };
}

function buildFullReport(totalScore, level, dimensionScores, strongest, weakest) {
  const detail = dimensionScores
    .map((dimension) => `${dimension.name}${dimension.score}分：${dimension.description}`)
    .join("\n");

  return [
    `测评等级：${level.name}（${totalScore}分）`,
    `核心判断：${level.summary}`,
    `优势维度：${strongest.name}。建议把这一项沉淀为客户看得见的案例、话术和成交证据。`,
    `短板维度：${weakest.name}。${advice[weakest.key]}`,
    "跟进建议：顾问可先围绕短板维度做一次15分钟诊断，再推荐定位梳理、产品重构、内容陪跑或成交话术训练。",
    "四维明细：",
    detail
  ].join("\n");
}

module.exports = {
  questions,
  scoreAssessment
};
