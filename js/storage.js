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
    const trained = record.trained === true || record.trainingType !== "休息";
    let dinnerQuality = record.dinnerQuality;
    if (!dinnerQuality) {
      if (record.dinnerType === "清淡") {
        dinnerQuality = "健康";
      } else if (app.config.heavyDinners.includes(record.dinnerType)) {
        dinnerQuality = "放纵";
      } else {
        dinnerQuality = "普通";
      }
    }

    return {
      ...record,
      walkMinutes: Number(record.walkMinutes) || 0,
      trained,
      trainingMinutes: Number(record.trainingMinutes) || 0,
      trainingCompletion: record.trainingCompletion || (trained ? "完整" : "未训练"),
      trainingRpe: Number(record.trainingRpe) || 0,
      warmupCooldown: record.warmupCooldown === true,
      dinnerQuality,
      fatigue: record.fatigue || "中",
      soreness: record.soreness || ""
    };
  }

  function saveRecords(records) {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }

  function loadRpgState() {
    try {
      const raw = localStorage.getItem(app.config.rpgStorageKey);
      if (!raw) {
        return { totalExp: 0, taskHistory: {} };
      }

      const state = JSON.parse(raw);
      return {
        totalExp: Number.isFinite(state.totalExp) ? state.totalExp : 0,
        taskHistory: state.taskHistory && typeof state.taskHistory === "object"
          ? state.taskHistory
          : {}
      };
    } catch (error) {
      console.warn("读取 RPG 状态失败，已使用初始状态。", error);
      return { totalExp: 0, taskHistory: {} };
    }
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
