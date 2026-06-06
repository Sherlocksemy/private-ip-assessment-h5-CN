# 私域IP商业变现测评 H5

这是一个面向中国大陆用户访问的 H5 测评网页。客户打开链接或扫码填写测评，提交后看到简易报告；完整报告写入飞书多维表格，顾问可在飞书中查看、筛选和导出。

## 当前方案

- 前端部署：腾讯云 EdgeOne Pages
- 数据后台：飞书多维表格
- 提交接口：EdgeOne Pages Functions
- 渠道追踪：支持 `?channel=朋友圈`、`?channel=社群`、`?channel=私聊`、`?channel=直播间`

## 功能

- 首页：私域IP商业变现测评介绍、四维度说明、开始测评。
- 测评页：客户昵称、微信号/手机号、行业、16 道测评题。
- 结果页：总分、等级、四维得分、优势维度、短板维度、简易建议。
- 完整报告：写入飞书多维表格，不直接展示给客户。

## 本地预览

可以直接打开 `demo.html` 预览，也可以用本地 Node 启动静态服务：

```bash
node local-server.js
```

## 飞书多维表格字段

请在飞书多维表格中创建这些字段，建议全部先用「文本」类型，方便第一版稳定写入：

```text
提交时间
客户昵称
微信号/手机号
行业
来源渠道
定位力
产品力
营销力
成交力
总分
等级
优势维度
短板维度
简易建议
完整报告
原始答案
```

## EdgeOne 环境变量

在 EdgeOne Pages 项目中配置这些环境变量：

```text
FEISHU_APP_ID
FEISHU_APP_SECRET
FEISHU_BITABLE_APP_TOKEN
FEISHU_TABLE_ID
```

说明：

- `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 来自飞书开放平台自建应用。
- `FEISHU_BITABLE_APP_TOKEN` 来自多维表格 URL。
- `FEISHU_TABLE_ID` 来自多维表格数据表 ID。
- 飞书应用需要开通多维表格记录写入权限，并发布/生效。

## EdgeOne 部署

1. 在 EdgeOne Pages 新建项目并连接 GitHub 仓库。
2. 构建命令填 `npm run build`。
3. 输出目录填 `dist`。
4. 配置飞书环境变量。
5. 部署完成后，用正式链接测试提交。

## 渠道二维码

部署后可以为不同渠道生成不同链接：

```text
https://your-edgeone-domain/?channel=朋友圈
https://your-edgeone-domain/?channel=社群
https://your-edgeone-domain/?channel=私聊
https://your-edgeone-domain/?channel=直播间
```

把这些链接分别生成二维码，客户扫码填写后，飞书多维表格中会记录对应来源渠道。

## 保留文件

- `miniprogram/` 和 `cloudfunctions/` 是早期小程序原型，已通过 `.gitignore` 排除。
- `api/submit.js` 是早期 Vercel + Google Sheets 接口，当前 EdgeOne 方案使用 `edge-functions/api/submit.js`。
