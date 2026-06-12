(function () {
  window.FitnessApp = window.FitnessApp || {};

  window.FitnessApp.config = {
    storageKey: "localFitnessRecords",
    heavyDinners: ["麦当劳", "炸物", "拉面"],
    fullTrainingTypes: ["上半身", "下半身", "全身"],
    aiEndpoint: "/api/ai-recommendation"
  };
})();
