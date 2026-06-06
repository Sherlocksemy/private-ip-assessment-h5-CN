import crypto from "node:crypto";
import { questions, scoreAssessment } from "../src/lib/assessment.js";

const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const tokenUrl = "https://oauth2.googleapis.com/token";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const { profile, answers, channel } = request.body || {};
    const message = validatePayload(profile, answers);
    if (message) {
      response.status(400).json({ message });
      return;
    }

    const result = scoreAssessment(answers);
    const row = buildSheetRow({ profile, answers, channel, result });
    const hasGoogleConfig = Boolean(
      process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    );

    if (hasGoogleConfig) {
      await appendToGoogleSheet(row);
    }

    response.status(200).json({
      saved: hasGoogleConfig,
      result
    });
  } catch (error) {
    response.status(500).json({
      message: "提交失败，请稍后重试",
      detail: error.message
    });
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

function buildSheetRow({ profile, answers, channel, result }) {
  const scoreByDimension = Object.fromEntries(
    result.dimensionScores.map((dimension) => [dimension.key, dimension.score])
  );

  return [
    new Date().toISOString(),
    profile.nickname,
    profile.contact,
    profile.industry,
    channel || "默认渠道",
    scoreByDimension.positioning,
    scoreByDimension.product,
    scoreByDimension.marketing,
    scoreByDimension.closing,
    result.totalScore,
    result.level.name,
    result.strongest.name,
    result.weakest.name,
    result.simpleAdvice.join("\n"),
    result.fullReport,
    JSON.stringify(answers)
  ];
}

async function appendToGoogleSheet(row) {
  const accessToken = await getGoogleAccessToken();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = encodeURIComponent(process.env.GOOGLE_SHEET_TAB || "Sheet1");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tab}!A:P:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets写入失败：${text}`);
  }
}

async function getGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: sheetsScope,
    aud: tokenUrl,
    exp: now + 3600,
    iat: now
  };

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(privateKey);
  const jwt = `${unsignedToken}.${base64Url(signature)}`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Google授权失败：${JSON.stringify(payload)}`);
  }

  return payload.access_token;
}

function base64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
