(function () {
  const app = window.FitnessApp;

  async function requestAiRecommendation(records, localRecommendation) {
    if (window.location.protocol === "file:") {
      throw new Error("AI 建议需要先启动本机代理，并通过 http://127.0.0.1:4173 打开。");
    }

    const response = await fetch(app.config.aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: app.storage.sortRecords(records).slice(0, 14),
        localRecommendation
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "AI 建议生成失败。");
    }
    return data.advice;
  }

  app.aiClient = {
    requestAiRecommendation
  };
})();
