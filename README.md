# 本地健身记录小工具

这是一个本地健身记录工具。核心记录、统计和规则推荐只使用 HTML、CSS 和原生 JavaScript，数据保存在浏览器 `localStorage`。

项目也提供一个可选的本机 AI 代理 `server.js`。它只在你需要 GPT 补充建议时使用，API Key 不会写进前端代码。

## 文件

- `index.html`：页面结构
- `style.css`：样式
- `app.js`：启动入口
- `js/config.js`：常量配置
- `js/date-utils.js`：日期工具
- `js/storage.js`：localStorage 读写
- `js/stats.js`：最近 7 天统计
- `js/recommendation-plans.js`：训练计划模板
- `js/recommendation-engine.js`：本地规则推荐引擎
- `js/ai-client.js`：浏览器请求本机 AI 代理
- `js/ui.js`：页面渲染和事件处理
- `server.js`：可选本机 AI 代理和静态文件服务
- `package.json`：本机服务启动脚本
- `README.md`：使用说明

## 方式一：不使用 AI，直接打开

直接用浏览器打开 `index.html` 即可，不需要服务器、数据库或安装依赖。记录、统计和本地规则推荐都会正常工作。

在 Windows 中可以：

1. 打开项目文件夹 `d:\fitness-tracker`
2. 双击 `index.html`

## 方式二：使用更安全的 GPT 建议

不要把 OpenAI API Key 写在 `app.js` 或任何前端文件里。浏览器直接调用 OpenAI API 会把 Key 暴露在源代码、开发者工具或网络请求中。

更安全的方式是启动本机代理：

1. 安装 Node.js 18 或更新版本。
2. 在 PowerShell 中设置环境变量：

```powershell
$env:OPENAI_API_KEY="你的 API Key"
```

3. 启动本机服务：

```powershell
npm start
```

4. 打开：

```text
http://127.0.0.1:4173
```

这时页面里的“生成 AI 建议”会请求 `server.js`，由本机代理调用 OpenAI API。API Key 只存在于本机环境变量中，不会进入浏览器代码。

可选设置模型：

```powershell
$env:OPENAI_MODEL="gpt-5.2"
```

## 如何测试

1. 添加一条今天的记录，点击“保存记录”。
2. 查看历史记录表格是否出现新记录。
3. 点击“编辑”，修改体重、步数或备注，再点击“更新记录”。
4. 点击“删除”，确认后检查记录是否删除。
5. 连续添加最近几天的数据，查看最近 7 天统计是否更新。
6. 尝试添加步数少于 6000、连续 2 天未训练、昨天晚饭为麦当劳/炸物/拉面、昨天完整训练等情况，查看“今日训练推荐”是否变化。

## 今日训练推荐逻辑

推荐完全在浏览器本地生成，不会上传记录。

它会综合这些数据：

- 最近一天步数
- 最近连续未训练天数
- 最近 7 条记录里的训练频率
- 昨天晚饭是否为麦当劳、炸物或拉面
- 昨天是否做了完整训练
- 最近一次完整训练是上半身还是下半身
- 最近 7 条记录是否缺少上半身或下半身训练

页面会输出：

- 推荐训练方式
- 建议时长
- 训练重点
- 热身步骤
- 动作清单
- 冷身拉伸
- 强度说明
- 饮食或恢复提示
- 推荐依据

## 数据保存位置

数据保存在当前浏览器的 `localStorage` 中，键名为：

```text
localFitnessRecords
```

清空浏览器站点数据或点击页面里的“清空全部”会删除记录。
