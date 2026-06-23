(function () {
  window.FitnessApp = window.FitnessApp || {};

  window.FitnessApp.config = {
    storageKey: "localFitnessRecords",
    rpgStorageKey: "fitnessRpgState",
    heavyDinners: ["麦当劳", "炸物", "拉面"],
    fullTrainingTypes: ["上半身", "下半身", "全身"],
    trainingCategories: [
      { id: "rest", label: "休息" },
      { id: "strength", label: "力量" },
      { id: "cardio", label: "有氧" },
      { id: "recovery", label: "恢复" }
    ],
    trainingFocusByCategory: {
      rest: [
        { id: "rest", label: "休息" }
      ],
      strength: [
        { id: "upper", label: "上半身" },
        { id: "lower", label: "下半身" },
        { id: "full", label: "全身" },
        { id: "push", label: "推" },
        { id: "pull", label: "拉" },
        { id: "core", label: "核心" },
        { id: "glutesLegs", label: "臀腿" }
      ],
      cardio: [
        { id: "walk", label: "散步" },
        { id: "briskWalk", label: "快走" },
        { id: "zone2", label: "Zone 2" },
        { id: "interval", label: "间歇" }
      ],
      recovery: [
        { id: "lightRecovery", label: "轻恢复" },
        { id: "stretch", label: "拉伸" },
        { id: "mobility", label: "灵活性" },
        { id: "yoga", label: "瑜伽" }
      ]
    },
    strengthFocusIds: ["upper", "lower", "full", "push", "pull", "core", "glutesLegs"],
    recoveryFocusIds: ["lightRecovery", "stretch", "mobility", "yoga"],
    dinnerQualities: ["健康", "普通", "放纵"],
    dinnerTags: [
      "鸡肉/鱼/豆腐",
      "蔬菜足够",
      "主食适量",
      "高油",
      "高盐",
      "外食",
      "拉面",
      "炸物",
      "麦当劳",
      "其他"
    ],
    heavyDinnerTags: ["麦当劳", "炸物", "拉面", "高油", "高盐"],
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
