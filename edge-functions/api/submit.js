import { questions, scoreAssessment } from "../../src/lib/assessment.js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPost(context) {
  try {
    const { profile, answers, channel } = await context.request.json();
    const message = validatePayload(profile, answers);

    if (message) {
      return json({ message }, 400);
    }

    const result = scoreAssessment(answers);
    const fields = buildFeishuFields({ profile, answers, channel, result });
    const hasFeishuConfig = Boolean(
      context.env.FEISHU_APP_ID &&
        context.env.FEISHU_APP_SECRET &&
        context.env.FEISHU_BITABLE_APP_TOKEN &&
        context.env.FEISHU_TABLE_ID
    );

    if (hasFeishuConfig) {
      await appendToFeishuBitable(context.env, fields);
    }

    return json({
      saved: hasFeishuConfig,
      result
    });
  } catch (error) {
    return json(
      {
        message: "提交失败，请稍后重试",
        detail: error.message
      },
      500
    );
  }
}

function validatePayload(profile, answers) {
  if (!profile || !profile.nickname || !profile.contact || !profile.industry) {
    return "请填写客户昵称、微信号/手机号和行业";
  }

  if (!answers || typeof answers !== "object") {
    return "请完成测评题";
  }

  const missingQuestion = questions.find((question) => !Number(answers[question.id]));
  if (missingQuestion) {
    return "请完成全部16道测评题";
  }

  return "";
}

function buildFeishuFields({ profile, answers, channel, result }) {
  const scoreByDimension = Object.fromEntries(
    result.dimensionScores.map((dimension) => [dimension.key, dimension.score])
  );

  return {
    提交时间: formatDate(new Date()),
    客户昵称: profile.nickname,
    "微信号/手机号": profile.contact,
    行业: profile.industry,
    来源渠道: channel || "默认渠道",
    定位力: String(scoreByDimension.positioning),
    产品力: String(scoreByDimension.product),
    营销力: String(scoreByDimension.marketing),
    成交力: String(scoreByDimension.closing),
    总分: String(result.totalScore),
    等级: result.level.name,
    优势维度: result.strongest.name,
    短板维度: result.weakest.name,
    简易建议: result.simpleAdvice.join("\n"),
    完整报告: result.fullReport,
    原始答案: JSON.stringify(answers)
  };
}

async function appendToFeishuBitable(env, fields) {
  const accessToken = await getTenantAccessToken(env);
  const appToken = encodeURIComponent(env.FEISHU_BITABLE_APP_TOKEN);
  const tableId = encodeURIComponent(env.FEISHU_TABLE_ID);
  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ fields })
    }
  );

  const payload = await response.json();
  if (!response.ok || payload.code !== 0) {
    throw new Error(`飞书多维表格写入失败：${JSON.stringify(payload)}`);
  }
}

async function getTenantAccessToken(env) {
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET
    })
  });

  const payload = await response.json();
  if (!response.ok || payload.code !== 0) {
    throw new Error(`飞书授权失败：${JSON.stringify(payload)}`);
  }

  return payload.tenant_access_token;
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders
  });
}
