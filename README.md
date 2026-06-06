# 私域IP商业变现测评 H5 Demo

这是一个可部署到 Vercel 的 H5 测评网页。客户打开链接或扫码填写测评，提交后看到简易报告；完整报告写入 Google Sheets，顾问可在表格中查看和导出。

## 功能

- 首页：私域IP商业变现测评介绍、四维度说明、开始测评。
- 测评页：客户昵称、微信号/手机号、行业、16 道测评题。
- 结果页：总分、等级、四维得分、优势维度、短板维度、简易建议。
- 完整报告：写入 Google Sheets，不直接展示给客户。
- 渠道追踪：支持 `?channel=朋友圈`、`?channel=社群`、`?channel=私聊`、`?channel=直播间`。

## 本地运行

```bash
npm install
npm run dev
```

打开本地地址后即可体验。没有配置 Google Sheets 时，页面仍会正常生成测评结果，但不会写入后台表格。

## Google Sheets 表头

请在表格第一行放入以下表头：

```text
提交时间,客户昵称,微信号/手机号,行业,来源渠道,定位力,产品力,营销力,成交力,总分,等级,优势维度,短板维度,简易建议,完整报告,原始答案
```

## 环境变量

复制 `.env.example` 并在 Vercel 项目中配置这些变量：

```text
GOOGLE_SHEET_ID
GOOGLE_SHEET_TAB
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
```

注意：

- `GOOGLE_SHEET_ID` 是 Google 表格链接中的 ID。
- `GOOGLE_SHEET_TAB` 默认可以填 `Sheet1`。
- `GOOGLE_PRIVATE_KEY` 需要保留换行，可以用 `\n` 形式。
- 需要把 Google 表格共享给服务账号邮箱，并授予编辑权限。

## Vercel 部署

1. 推送代码到 GitHub。
2. 在 Vercel 新建项目并连接 GitHub 仓库。
3. Framework 选择 Vite。
4. 配置环境变量。
5. 部署完成后获得在线链接，例如 `https://your-project.vercel.app`。

## 渠道二维码

部署后可以为不同渠道生成不同链接：

```text
https://your-project.vercel.app?channel=朋友圈
https://your-project.vercel.app?channel=社群
https://your-project.vercel.app?channel=私聊
https://your-project.vercel.app?channel=直播间
```

把这些链接分别生成二维码，客户扫码填写后，Google Sheets 中会记录对应来源渠道。

## 保留的小程序版本

目录中的 `miniprogram/` 和 `cloudfunctions/` 是之前的小程序版本，当前 H5 demo 不依赖它们。
