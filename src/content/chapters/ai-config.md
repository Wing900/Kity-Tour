---
number: "05"
folder: 快速上手
title: AI配置（以Deepseek为例）
lead: AI 才能帮你画图。配置一次，之后一直能用。这里以 Deepseek 为例走一遍。
minutes: "5"
order: "5"
---

## 什么是 AI 的 API

AI 可以帮我们做很多活，比如写文章、写代码。有时候，我们不仅想用它来对话，还希望：

- 鼠标选中一个单词，它就翻译出来
- 圈起书里的一个段落，它就对你解释

要做到这些，就需要 **AI 的 API 服务**。

![对话之外的 AI](data/scene-files/s-1779939470687/407c676dc700ba030c05afb483f92a98657d232d.png "把 AI 接进自己的工作流")

## 三个东西：URL、KEY、Model

先看一张图，了解什么是 API_URL、KEY，还有 Model 名。

![API_URL / KEY / Model](data/scene-files/s-1779936332343/215f3739682243d0ededae464464f1b75cd91695.png "配置 AI 服务需要这三者")

看来你明白了！我们需要这三者来配置 AI 服务。

> **前情提要**：AI 的 API 服务不是免费的，你需要给模型商付费（有的贵、有的便宜）。如果你觉得配置很麻烦，或者模型效果不好，也可以订阅我们的模型服务，那很便宜。

## 在 Deepseek 拿到 KEY

那么我们怎么获取 API_URL 和 KEY 呢？以 Deepseek 为例。

[进入 Deepseek 平台](https://platform.deepseek.com/)（点这一行进入）。

登录后我们看到控制台。

![Deepseek 控制台](data/scene-files/s-1779936176915/d4cb9fa57dbafcc58ba4b2297ec4ab09f4b8f92e.png "登录后看到控制台")

点击左侧的 API KEY。

![API KEY 页面](data/scene-files/s-1779936176915/8baf746c7a6b4d095e4bf288bbe66c32a37856ed.png "点击左侧的 API KEY")

点击「创建 API key」，输入一个名字，然后创建。

![创建 API key](data/scene-files/s-1779936176915/12f2bf90c73361c51cd5942f6b7f328cce046060.png "点击创建 API key")

到这里，你就获得了一个 Key，复制并保存它。

![生成的 KEY](data/scene-files/s-1779936176915/beb36b4a81d2304d0f39252dcbce6c9b8609ffb8.png "复制保存这个 Key，之后不会再完整显示")

> 你可能需要先实名认证。这一步略过，按平台提示走即可。

## 拿到 URL 和 Model 名

一般来说，AI 公司提供的 URL 和 Model 名都是公开的，会写在文档里面。

![接口文档入口](data/scene-files/s-1779937801512/fba0444da72cc233c0813423c02dbd27ab1b9f8d.png "点击左侧接口文档")

![文档中的说明](data/scene-files/s-1779937801512/1e90347d489a5ff9cde559c09d6c1d1df04139df.png "文档里已经写明了 URL 和 Model 名")

看看，它已经写明了。我们一般都使用 OpenAI 的格式。

```
API_URL: https://api.deepseek.com
API_KEY: sk-xxxxxxxxxx
Model:   deepseek-v4-pro
```

三者集齐了！

## 在 PlotKityCat 上填进去

点击左下角的 AI 配置按钮。

![AI 配置入口](data/scene-files/s-1779938773347/e353175c3cc00f49d7283400fa3ae013995e450a.png "点击左下角的 AI 配置按钮")

对应填入你的 URL、Key、Model。

![填写配置](data/scene-files/s-1779938773347/bcfea04af0d9b2605bd951aa4d64ed467b74755c.png "对应填入你的 URL、Key、Model")

> **一个细节**：URL 需要在后面加一个 `/v1`，这是因为 OpenAI 的格式需要。

填好了，像这样：

![填好的配置](data/scene-files/s-1779938773347/7f3db91a5313b59dc9159216883dd2e95fb774c0.png "填好的样子")

```
API_URL: https://api.deepseek.com/v1
API_KEY: sk-xxxxxxxxxx
Model:   deepseek-v4-pro
```

如果都满意，就点击关闭吧！

AI 配置到此就完成了。注意，AI 模型的 API 不是免费的，你需要在 Deepseek 官网充值才能使用。如果你觉得很麻烦，或者模型效果不好，也可以订阅我们的模型服务。
