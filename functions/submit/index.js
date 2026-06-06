const { questions, scoreAssessment } = require("./assessment.cjs");

exports.main = async (event) => {
  try {
    console.log("submit:start", {
      hasAppId: Boolean(process.env.FEISHU_APP_ID),
      hasAppSecret: Boolean(process.env.FEISHU_APP_SECRET),
      hasBitableToken: Boolean(process.env.FEISHU_BITABLE_APP_TOKEN),
      hasTableId: Boolean(process.env.FEISHU_TABLE_ID)
    });

    const request = normalizeRequest(event);

    if (request.method === "OPTIONS") {
      return response(204, "");
    }

    if (request.method !== "POST") {
      return json({ message: "Method not allowed" }, 405);
    }

    const { profile, answers, channel } = request.body;
    const message = validatePayload(profile, answers);

    if (message) {
      return json({ message }, 400);
    }

    const result = scoreAssessment(answers);
    const hasFeishuConfig = Boolean(
      process.env.FEISHU_APP_ID &&
        process.env.FEISHU_APP_SECRET &&
        process.env.FEISHU_BITABLE_APP_TOKEN &&
        process.env.FEISHU_TABLE_ID
    );

    if (hasFeishuConfig) {
      const feishuPayload = await appendToFeishuBitable(buildFeishuFields({ profile, answers, channel, result }));
      console.log("submit:feishu-success", {
        recordId: feishuPayload?.data?.record?.record_id || feishuPayload?.data?.record_id || ""
      });
    } else {
      console.log("submit:feishu-skipped-missing-env");
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
};

function normalizeRequest(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || "POST";
  let body = event.body || event.rawBody || event;

  if (typeof body === "string") {
    body = body ? JSON.parse(body) : {};
  }

  return {
    method: method.toUpperCase(),
    body
  };
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

  const fields = {
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
  console.log("submit:formatted-time", fields.提交时间);
  return fields;
}

async function appendToFeishuBitable(fields) {
  const accessToken = await getTenantAccessToken();
  const appToken = encodeURIComponent(process.env.FEISHU_BITABLE_APP_TOKEN);
  const tableId = encodeURIComponent(process.env.FEISHU_TABLE_ID);
  const feishuResponse = await fetch(
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

  const payload = await feishuResponse.json();
  console.log("submit:feishu-response", {
    status: feishuResponse.status,
    code: payload.code,
    msg: payload.msg
  });
  if (!feishuResponse.ok || payload.code !== 0) {
    throw new Error(`飞书多维表格写入失败：${JSON.stringify(payload)}`);
  }

  return payload;
}

async function getTenantAccessToken() {
  const tokenResponse = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });

  const payload = await tokenResponse.json();
  console.log("submit:token-response", {
    status: tokenResponse.status,
    code: payload.code,
    msg: payload.msg
  });
  if (!tokenResponse.ok || payload.code !== 0) {
    throw new Error(`飞书授权失败：${JSON.stringify(payload)}`);
  }

  return payload.tenant_access_token;
}

function json(payload, statusCode = 200) {
  return response(statusCode, JSON.stringify(payload), {
    "Content-Type": "application/json; charset=utf-8"
  });
}

function response(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...headers
    },
    body
  };
}

function formatDate(date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .formatToParts(date)
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}
