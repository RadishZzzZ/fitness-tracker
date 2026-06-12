(function () {
  window.FitnessApp = window.FitnessApp || {};

  window.FitnessApp.config = {
    storageKey: "localFitnessRecords",
    rpgStorageKey: "fitnessRpgState",
    heavyDinners: ["麦当劳", "炸物", "拉面"],
    fullTrainingTypes: ["上半身", "下半身", "全身"],
    aiEndpoint: "/api/ai-recommendation",
    dailyTasks: [
      { id: "activity", name: "达到 6000 步", exp: 25, category: "exercise" },
      { id: "walk", name: "散步 20 分钟", exp: 30, category: "exercise" },
      { id: "dynamicTraining", name: "今日训练", exp: 40, category: "exercise" },
      { id: "warmupCooldown", name: "完成热身和拉伸", exp: 20, category: "exercise" },
      { id: "healthyDinner", name: "健康晚餐", exp: 25, category: "nutrition" }
    ]
  };
})();
