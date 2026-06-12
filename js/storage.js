(function () {
  const app = window.FitnessApp;
  const { storageKey } = app.config;

  function loadRecords() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn("读取记录失败，已使用空记录。", error);
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(storageKey, JSON.stringify(records));
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
    sortRecords,
    createId
  };
})();
