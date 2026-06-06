# 私域IP商业变现测评 H5

这是一个面向中国大陆用户访问的 H5 测评网页。客户打开链接或扫码填写测评，提交后看到简易报告；完整报告写入飞书多维表格，顾问可在飞书中查看、筛选和导出。

## 当前方案

- 静态页面托管：腾讯云 CloudBase 静态网站托管
- 提交接口：CloudBase 云函数 `submit`
- 数据后台：飞书多维表格
- 渠道追踪：支持 `?channel=朋友圈`、`?channel=社群`、`?channel=私聊`、`?channel=直播间`

## 功能

- 首页：私域IP商业变现测评介绍、四维度说明、开始测评。
- 测评页：客户昵称、微信号/手机号、行业、16 道测评题。
- 结果页：总分、等级、四维得分、优势维度、短板维度、简易建议。
- 完整报告：写入飞书多维表格，不直接展示给客户。

## CloudBase 部署文件

- `index.html`、`src/`：静态页面。
- `functions/submit/`：CloudBase 云函数，负责评分和写入飞书。
- `cloudbaserc.json`：CloudBase Framework 配置模板。

`cloudbaserc.json` 里的 `envId` 目前是占位符：

```json
"envId": "{{CLOUDBASE_ENV_ID}}"
```

部署前需要替换为你的 CloudBase 环境 ID。

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

## CloudBase 云函数环境变量

在 CloudBase 云函数 `submit` 中配置这些环境变量：

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

## 前端提交地址

前端默认提交到：

```text
/api/submit
```

如果 CloudBase 控制台给你的云函数 HTTP 访问地址不是这个路径，可以在 `index.html` 中加入配置：

```html
<script>
  window.APP_CONFIG = {
    submitUrl: "你的CloudBase云函数HTTP访问地址"
  };
</script>
```

这段脚本需要放在 `src/plain-app.js` 之前。

## 本地预览

本地可以用 Node 服务预览：

```bash
node server.js
```

默认地址：

```text
http://localhost:3000
```

## 渠道二维码

部署后可以为不同渠道生成不同链接：

```text
https://your-cloudbase-domain/?channel=朋友圈
https://your-cloudbase-domain/?channel=社群
https://your-cloudbase-domain/?channel=私聊
https://your-cloudbase-domain/?channel=直播间
```

把这些链接分别生成二维码，客户扫码填写后，飞书多维表格中会记录对应来源渠道。

## 保留文件

- `miniprogram/` 和 `cloudfunctions/` 是早期小程序原型，已通过 `.gitignore` 排除。
- `server.js` 仅用于本地预览，CloudBase 静态托管不会上传它。
- `demo.html` 是本地预览单文件，已通过 `.gitignore` 排除。
