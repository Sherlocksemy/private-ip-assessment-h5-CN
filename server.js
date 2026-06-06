import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { questions, scoreAssessment } from "./src/lib/assessment.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
const staticTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

http
  .createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://localhost:${port}`);

      if (url.pathname === "/api/submit") {
        await handleSubmit(request, response);
        return;
      }

      serveStatic(url, response);
    } catch (error) {
      sendJson(response, 500, {
        message: "服务异常，请稍后重试",
        detail: error.message
      });
    }
  })
  .listen(port, () => {
    console.log(`Private IP assessment H5 is running on port ${port}`);
  });

async function handleSubmit(request, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, jsonHeaders);
    response.end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Method not allowed" });
    return;
  }

  const payload = await readJson(request);
  const { profile, answers, channel } = payload;
  const message = validatePayload(profile, answers);

  if (message) {
    sendJson(response, 400, { message });
    return;
  }

  const result = scoreAssessment(answers);
  const hasFeishuConfig = Boolean(
    process.env.FEISHU_APP_ID &&
      process.env.FEISHU_APP_SECRET &&
      process.env.FEISHU_BITABLE_APP_TOKEN &&
      process.env.FEISHU_TABLE_ID
  );

  if (hasFeishuConfig) {
    await appendToFeishuBitable(buildFeishuFields({ profile, answers, channel, result }));
  }

  sendJson(response, 200, {
    saved: hasFeishuConfig,
    result
  });
}

function serveStatic(url, response) {
  let filePath = path.join(root, decodeURIComponent(url.pathname));

  if (url.pathname === "/" || !path.extname(filePath)) {
    filePath = path.join(root, "index.html");
  }

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(root, "index.html"), (fallbackError, fallbackContent) => {
        if (fallbackError) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }

        response.writeHead(200, { "Content-Type": staticTypes[".html"] });
        response.end(fallbackContent);
      });
      return;
    }

    response.writeHead(200, { "Content-Type": staticTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
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

async function appendToFeishuBitable(fields) {
  const accessToken = await getTenantAccessToken();
  const appToken = encodeURIComponent(process.env.FEISHU_BITABLE_APP_TOKEN);
  const tableId = encodeURIComponent(process.env.FEISHU_TABLE_ID);
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

async function getTenantAccessToken() {
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });

  const payload = await response.json();
  if (!response.ok || payload.code !== 0) {
    throw new Error(`飞书授权失败：${JSON.stringify(payload)}`);
  }

  return payload.tenant_access_token;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("请求内容过大"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(new Error("请求内容不是有效JSON"));
      }
    });
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(payload));
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
}
