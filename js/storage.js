(function () {
  const app = window.FitnessApp;
  const { storageKey } = app.config;

  function loadRecords() {
    try {
      const raw = localStorage.getItem(storageKey);
      const records = raw ? JSON.parse(raw) : [];
      return Array.isArray(records) ? records.map(normalizeRecord) : [];
    } catch (error) {
      console.warn("读取记录失败，已使用空记录。", error);
      return [];
    }
  }

  function normalizeRecord(record) {
    const training = normalizeTraining(record);
    const trained = training.category !== "rest";
    const dinnerQuality = normalizeDinnerQuality(record);
    const dinnerTags = normalizeDinnerTags(record);

    return {
      ...record,
      walkMinutes: Number(record.walkMinutes) || 0,
      trained,
      trainingCategory: training.category,
      trainingFocus: training.focus,
      trainingType: training.label,
      trainingMinutes: Number(record.trainingMinutes) || 0,
      trainingCompletion: record.trainingCompletion || (trained ? "完整" : "未训练"),
      trainingRpe: Number(record.trainingRpe) || 0,
      warmupCooldown: record.warmupCooldown === true,
      dinnerQuality,
      dinnerTags,
      fatigue: record.fatigue || "中",
      soreness: record.soreness || ""
    };
  }

  function normalizeTraining(record) {
    const legacyMap = {
      休息: { category: "rest", focus: "rest" },
      散步: { category: "cardio", focus: "walk" },
      上半身: { category: "strength", focus: "upper" },
      下半身: { category: "strength", focus: "lower" },
      全身: { category: "strength", focus: "full" },
      轻恢复: { category: "recovery", focus: "lightRecovery" }
    };
    const categoryIds = app.config.trainingCategories.map((item) => item.id);
    let category = categoryIds.includes(record.trainingCategory)
      ? record.trainingCategory
      : "";
    let focus = record.trainingFocus || "";

    if (!category && legacyMap[record.trainingType]) {
      category = legacyMap[record.trainingType].category;
      focus = legacyMap[record.trainingType].focus;
    }
    if (!category) {
      category = record.trained ? "strength" : "rest";
    }

    const options = app.config.trainingFocusByCategory[category] || [];
    if (!options.some((item) => item.id === focus)) {
      focus = options[0] ? options[0].id : "rest";
    }

    return {
      category,
      focus,
      label: getTrainingFocusLabel(focus)
    };
  }

  function getTrainingFocusLabel(focusId) {
    const allOptions = Object.values(app.config.trainingFocusByCategory).flat();
    const option = allOptions.find((item) => item.id === focusId);
    return option ? option.label : "休息";
  }

  function normalizeDinnerQuality(record) {
    if (app.config.dinnerQualities.includes(record.dinnerQuality)) {
      return record.dinnerQuality;
    }
    if (record.dinnerType === "清淡") {
      return "健康";
    }
    if (app.config.heavyDinners.includes(record.dinnerType)) {
      return "放纵";
    }
    return "普通";
  }

  function normalizeDinnerTags(record) {
    if (Array.isArray(record.dinnerTags)) {
      return record.dinnerTags.filter((tag) => app.config.dinnerTags.includes(tag));
    }
    if (app.config.heavyDinners.includes(record.dinnerType)) {
      return [record.dinnerType];
    }
    if (record.dinnerType === "清淡") {
      return ["蔬菜足够", "主食适量"];
    }
    if (record.dinnerType === "其他") {
      return ["其他"];
    }
    return [];
  }

  function saveRecords(records) {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }

  function loadRpgState() {
    try {
      const raw = localStorage.getItem(app.config.rpgStorageKey);
      if (!raw) {
        return createInitialRpgState();
      }

      const state = JSON.parse(raw);
      const totalExp = Number.isFinite(state.totalExp) ? state.totalExp : 0;
      const currentLevel = calculateLevel(totalExp);
      const rewardedMilestones = Array.isArray(state.rewardedMilestones)
        ? state.rewardedMilestones
        : getReachedMilestones(currentLevel);

      return {
        totalExp,
        taskHistory: state.taskHistory && typeof state.taskHistory === "object"
          ? state.taskHistory
          : {},
        highestLevelSeen: Number.isFinite(state.highestLevelSeen)
          ? state.highestLevelSeen
          : currentLevel,
        recoveryTokens: Number.isFinite(state.recoveryTokens)
          ? state.recoveryTokens
          : rewardedMilestones.length,
        rewardedMilestones,
        protectedDates: Array.isArray(state.protectedDates) ? state.protectedDates : [],
        weeklyRewards: state.weeklyRewards && typeof state.weeklyRewards === "object"
          ? state.weeklyRewards
          : {}
      };
    } catch (error) {
      console.warn("读取 RPG 状态失败，已使用初始状态。", error);
      return createInitialRpgState();
    }
  }

  function createInitialRpgState() {
    return {
      totalExp: 0,
      taskHistory: {},
      highestLevelSeen: 1,
      recoveryTokens: 0,
      rewardedMilestones: [],
      protectedDates: [],
      weeklyRewards: {}
    };
  }

  function calculateLevel(totalExp) {
    let level = 1;
    let remaining = Math.max(0, totalExp);
    while (remaining >= level * 100) {
      remaining -= level * 100;
      level += 1;
    }
    return level;
  }

  function getReachedMilestones(level) {
    const milestones = [];
    for (let milestone = 5; milestone <= level; milestone += 5) {
      milestones.push(milestone);
    }
    return milestones;
  }

  function saveRpgState(state) {
    localStorage.setItem(app.config.rpgStorageKey, JSON.stringify(state));
  }

  function sortRecords(records) {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `record-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  app.storage = {
    loadRecords,
    saveRecords,
    loadRpgState,
    saveRpgState,
    normalizeRecord,
    sortRecords,
    createId
  };
})();
