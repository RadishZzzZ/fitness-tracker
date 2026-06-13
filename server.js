const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.2";
const MAX_BODY_BYTES = 80_000;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "POST" && url.pathname === "/api/ai-recommendation") {
      await handleAiRecommendation(request, response);
      return;
    }

    if (request.method === "GET") {
      serveStatic(url.pathname, response);
      return;
    }

    sendJson(response, 405, { error: "不支持这个请求方法。" });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "服务器内部错误。" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Fitness tracker running at http://127.0.0.1:${PORT}`);
});

function serveStatic(pathname, response) {
  const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.resolve(ROOT, `.${safePath}`);

  if (!filePath.startsWith(ROOT)) {
    sendText(response, 403, "禁止访问。");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(response, 404, "文件不存在。");
      return;
    }

    const ext = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    response.end(data);
  });
}

async function handleAiRecommendation(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 500, {
      error: "本机代理未设置 OPENAI_API_KEY。请先在终端设置环境变量。"
    });
    return;
  }

  if (typeof fetch !== "function") {
    sendJson(response, 500, {
      error: "当前 Node 版本不支持 fetch。请使用 Node 18 或更新版本。"
    });
    return;
  }

  const payload = await readJsonBody(request);
  const records = Array.isArray(payload.records) ? payload.records.slice(0, 14) : [];
  const localRecommendation = payload.localRecommendation || {};

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content: "你是一个谨慎的健身记录辅助助手。不要提供医疗诊断。用中文给出简洁、可执行、偏保守的训练建议。"
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "基于本地规则推荐和最近记录，补充今天训练建议。请输出 4-8 句话，包含热身、主训练、拉伸和注意事项。",
            localRecommendation,
            recentRecords: records
          })
        }
      ]
    })
  });

  const data = await apiResponse.json();
  if (!apiResponse.ok) {
    sendJson(response, apiResponse.status, {
      error: data.error && data.error.message ? data.error.message : "OpenAI API 请求失败。"
    });
    return;
  }

  sendJson(response, 200, {
    advice: extractResponseText(data)
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error("请求内容过大。"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("请求 JSON 格式无效。"));
      }
    });

    request.on("error", reject);
  });
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const text = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        text.push(content.text);
      }
    }
  }
  return text.join("\n").trim() || "AI 没有返回可读建议。";
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text) {
  response.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(text);
}
