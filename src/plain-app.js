import { dimensions, groupQuestions, questions, scoreAssessment } from "./lib/assessment.js";

const state = {
  step: "home",
  profile: { nickname: "", contact: "", industry: "" },
  answers: {},
  result: null,
  saveStatus: "",
  channel: new URLSearchParams(window.location.search).get("channel") || "默认渠道"
};

const root = document.getElementById("root");
const scoreOptions = [1, 2, 3, 4, 5];

function render() {
  if (state.step === "home") renderHome();
  if (state.step === "assessment") renderAssessment();
  if (state.step === "result") renderResult();
}

function renderHome() {
  root.innerHTML = `
    <main class="app-shell">
      <div class="phone-frame">
        <section class="screen home-screen">
          <header class="brand-row">
            <div class="brand-mark">IP</div>
            <div>
              <p class="brand-name">商业变现诊断</p>
              <p class="channel-label">来源：${escapeHtml(state.channel)}</p>
            </div>
          </header>

          <div class="hero">
            <p class="eyebrow">1-2分钟 · 四维度 · 私域成交顾问版</p>
            <h1>私域IP<br />商业变现测评</h1>
            <p class="hero-copy">看清你的定位、产品、营销、成交四个关键卡点，生成专属变现诊断。</p>
          </div>

          <div class="visual-card">
            <div class="radar-preview"><span></span><span></span><b></b></div>
            <div class="bar-preview">
              <i class="bar-1"></i><i class="bar-2"></i><i class="bar-3"></i><i class="bar-4"></i>
            </div>
          </div>

          <div class="dimension-grid">
            ${dimensions.map((dimension) => `
              <article class="mini-card">
                <h2>${dimension.name}</h2>
                <p>${dimension.description}</p>
              </article>
            `).join("")}
          </div>

          <button class="primary-button" data-action="start">开始测评</button>
        </section>
      </div>
    </main>
  `;
}

function renderAssessment() {
  const answeredCount = Object.keys(state.answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  root.innerHTML = `
    <main class="app-shell">
      <div class="phone-frame">
        <section class="screen assessment-screen">
          <button class="text-button" data-action="home">返回首页</button>
          <div class="section-title">
            <p>STEP 01</p>
            <h1>填写基础信息</h1>
            <span>用于顾问后续发送完整报告和私域变现建议。</span>
          </div>

          <div class="form-card">
            ${fieldHtml("客户昵称", "nickname", "请输入昵称")}
            ${fieldHtml("微信号/手机号", "contact", "请输入微信号或手机号")}
            ${fieldHtml("行业", "industry", "例如：知识付费 / 美业 / 教培")}
          </div>

          <div class="sticky-progress">
            <span>已完成 ${progress}%</span>
            <div><b style="width:${progress}%"></b></div>
          </div>

          <div class="section-title compact">
            <p>STEP 02</p>
            <h1>完成16道测评题</h1>
            <span>1分代表非常不符合，5分代表非常符合。</span>
          </div>

          ${groupQuestions().map((dimension) => `
            <article class="question-card">
              <header>
                <h2>${dimension.name}</h2>
                <p>${dimension.description}</p>
              </header>
              ${dimension.questions.map((question) => `
                <div class="question-item">
                  <p>${question.index}. ${question.text}</p>
                  <div class="score-row">
                    ${scoreOptions.map((score) => `
                      <button class="${state.answers[question.id] === score ? "active" : ""}" data-question="${question.id}" data-score="${score}">
                        ${score}
                      </button>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </article>
          `).join("")}

          <button class="primary-button bottom-button" data-action="submit">生成测评结果</button>
        </section>
      </div>
    </main>
  `;
}

function renderResult() {
  const result = state.result;
  root.innerHTML = `
    <main class="app-shell">
      <div class="phone-frame">
        <section class="screen result-screen">
          <div class="result-hero">
            <p class="eyebrow">ASSESSMENT REPORT</p>
            <h1>私域IP商业变现测评</h1>
            <div class="score-circle"><strong>${result.totalScore}</strong><span>分</span></div>
            <h2>${result.level.name}</h2>
            <p>${result.level.summary}</p>
            <em>${state.saveStatus}</em>
          </div>

          <div class="report-card">
            <div class="card-head"><h2>四维能力图谱</h2><span>满分100</span></div>
            ${radarHtml(result.dimensionScores)}
            <div class="score-list">
              ${result.dimensionScores.map((dimension) => `
                <div class="score-item">
                  <div><span>${dimension.name}</span><strong>${dimension.score}分</strong></div>
                  <i><b style="width:${dimension.score}%"></b></i>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="report-card">
            <h2>简易诊断</h2>
            <div class="tag-row">
              <div><span>优势</span><strong>${result.strongest.name}</strong></div>
              <div><span>短板</span><strong>${result.weakest.name}</strong></div>
            </div>
            ${result.simpleAdvice.map((item, index) => `<p class="advice">${index + 1}. ${item}</p>`).join("")}
          </div>

          <div class="consult-card">
            <h2>完整报告请咨询顾问领取</h2>
            <p>顾问会结合你的行业、分数和短板维度，给你一份更具体的私域变现路径建议。</p>
            <button class="secondary-button" data-action="copy">复制领取话术</button>
          </div>

          <button class="ghost-button" data-action="restart">重新测评</button>
        </section>
      </div>
    </main>
  `;
}

function fieldHtml(label, field, placeholder) {
  return `
    <label class="field">
      <span>${label}</span>
      <input data-field="${field}" value="${escapeHtml(state.profile[field])}" placeholder="${placeholder}" />
    </label>
  `;
}

function radarHtml(scores) {
  const points = scores.map((dimension, index) => {
    const point = axisPoint(index, 72 * (dimension.score / 100), scores.length);
    return `${point.x},${point.y}`;
  }).join(" ");

  return `
    <svg class="radar-chart" viewBox="0 0 200 172" role="img" aria-label="四维能力雷达图">
      ${[24, 48, 72].map((radius) => `<polygon points="${polygonPoints(radius)}" fill="none" stroke="#dfc5a5" stroke-width="1" />`).join("")}
      ${scores.map((dimension, index) => {
        const point = axisPoint(index, 78, scores.length);
        const label = axisPoint(index, 94, scores.length);
        return `
          <g>
            <line x1="100" y1="86" x2="${point.x}" y2="${point.y}" stroke="#ead8bf" />
            <text x="${label.x}" y="${label.y}" text-anchor="middle">${dimension.name}</text>
          </g>
        `;
      }).join("")}
      <polygon points="${points}" fill="rgba(139, 47, 31, 0.26)" stroke="#8b2f1f" stroke-width="2" />
    </svg>
  `;
}

function polygonPoints(radius) {
  return [0, 1, 2, 3].map((index) => {
    const point = axisPoint(index, radius, 4);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function axisPoint(index, radius, count) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: 100 + Math.cos(angle) * radius,
    y: 86 + Math.sin(angle) * radius
  };
}

async function submitAssessment() {
  const message = validate();
  if (message) {
    window.alert(message);
    return;
  }

  const localResult = scoreAssessment(state.answers);
  state.result = localResult;
  state.saveStatus = "正在保存到顾问后台表格...";
  state.step = "result";
  render();

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: state.profile,
        answers: state.answers,
        channel: state.channel
      })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "提交失败");
    state.result = payload.result || localResult;
    state.saveStatus = payload.saved ? "已保存到顾问后台表格" : "已生成结果，配置Google Sheets后会自动保存";
  } catch (error) {
    state.saveStatus = "已生成本地结果，暂未写入后台表格";
  }
  render();
}

function validate() {
  if (!state.profile.nickname.trim() || !state.profile.contact.trim() || !state.profile.industry.trim()) {
    return "请先填写客户昵称、微信号/手机号和行业。";
  }

  if (Object.keys(state.answers).length !== questions.length) {
    return "请完成全部16道测评题。";
  }

  return "";
}

async function copyConsultText() {
  const text = `你好，我已完成私域IP商业变现测评。昵称：${state.profile.nickname}，行业：${state.profile.industry}，测评分数：${state.result.totalScore}分，等级：${state.result.level.name}。我想领取完整报告。`;
  await navigator.clipboard.writeText(text);
  window.alert("领取话术已复制");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

root.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  if (!field) return;
  state.profile[field] = event.target.value;
});

root.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const question = event.target.dataset.question;

  if (question) {
    state.answers[question] = Number(event.target.dataset.score);
    renderAssessment();
    return;
  }

  if (action === "start") state.step = "assessment";
  if (action === "home") state.step = "home";
  if (action === "submit") submitAssessment();
  if (action === "copy") copyConsultText();
  if (action === "restart") {
    state.step = "home";
    state.profile = { nickname: "", contact: "", industry: "" };
    state.answers = {};
    state.result = null;
    state.saveStatus = "";
  }

  if (action && action !== "submit" && action !== "copy") render();
});

render();
