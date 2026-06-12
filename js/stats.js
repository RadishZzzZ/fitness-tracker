(function () {
  const app = window.FitnessApp;

  function getLastSevenDays(records) {
    return app.storage.sortRecords(records).slice(0, 7);
  }

  function averageSteps(records) {
    const stepRecords = records.filter((record) => Number.isFinite(record.steps));
    const totalSteps = stepRecords.reduce((sum, record) => sum + record.steps, 0);
    return stepRecords.length ? Math.round(totalSteps / stepRecords.length) : 0;
  }

  function countRecentNoTrainingDays(sortedRecords) {
    let count = 0;
    for (const record of sortedRecords) {
      if (record.trained) {
        break;
      }
      count += 1;
    }
    return count;
  }

  function formatWeightChange(records) {
    const withWeight = [...records]
      .filter((record) => Number.isFinite(record.weight))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (withWeight.length < 2) {
      return "暂无";
    }

    const diff = withWeight[withWeight.length - 1].weight - withWeight[0].weight;
    const prefix = diff > 0 ? "+" : "";
    return `${prefix}${diff.toFixed(1)} kg`;
  }

  function summarizeRecent(records) {
    const recent = getLastSevenDays(records);
    return {
      recent,
      averageSteps: averageSteps(recent),
      trainingDays: recent.filter((record) => record.trained).length,
      weightChange: formatWeightChange(recent),
      heavyDinnerCount: recent.filter((record) => app.config.heavyDinners.includes(record.dinnerType)).length
    };
  }

  app.stats = {
    getLastSevenDays,
    averageSteps,
    countRecentNoTrainingDays,
    formatWeightChange,
    summarizeRecent
  };
})();
