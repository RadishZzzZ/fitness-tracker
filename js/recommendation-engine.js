(function () {
  const app = window.FitnessApp;

  function buildTrainingRecommendation(records) {
    const sorted = app.storage.sortRecords(records);
    const latest = sorted[0];
    const yesterday = sorted.find((record) => record.date === app.dateUtils.yesterdayString());
    const recent = app.stats.getLastSevenDays(records);
    const recentTrainingDays = recent.filter((record) => record.trained).length;
    const recentNoTrainingDays = app.stats.countRecentNoTrainingDays(sorted);
    const recentAverageSteps = app.stats.averageSteps(recent);
    const heavyDinnerYesterday = Boolean(yesterday && app.stats.hasHeavyDinner(yesterday));
    const fullTrainingYesterday = Boolean(
      yesterday && yesterday.trained && isStrengthRecord(yesterday)
    );
    const lastTraining = sorted.find(
      (record) => record.trained && isStrengthRecord(record)
    );
    const trainedUpperRecently = recent.some((record) => isUpperFocus(record.trainingFocus));
    const trainedLowerRecently = recent.some((record) => isLowerFocus(record.trainingFocus));
    const reasons = [];

    if (!latest) {
      return app.recommendationPlans.plan("starter", [
        "目前还没有历史记录，无法判断训练频率、步数和恢复情况。"
      ]);
    }

    if (latest.steps < 6000) {
      reasons.push("最近一天步数少于 6000，优先补活动量。");
    }
    if (recentNoTrainingDays >= 2) {
      reasons.push("最近连续 2 天没有训练，需要恢复训练节奏。");
    }
    if (heavyDinnerYesterday) {
      reasons.push("昨天晚饭是麦当劳/炸物/拉面，今天不建议高强度硬练。");
    }
    if (fullTrainingYesterday) {
      reasons.push("昨天做了完整训练，今天更适合散步或轻恢复。");
    }
    if (recentTrainingDays < 2) {
      reasons.push("最近 7 条记录中训练天数少于 2 天，可以补一次轻量训练。");
    }

    if (fullTrainingYesterday) {
      return app.recommendationPlans.plan("recoveryWalk", reasons, {
        recovery: heavyDinnerYesterday
          ? "晚饭建议鸡肉/鱼/豆腐 + 蔬菜 + 少量主食，避免再叠加高油高盐。"
          : "今天保持轻松，睡前不要追加高强度训练。"
      });
    }
    if (heavyDinnerYesterday && latest.steps < 6000) {
      return app.recommendationPlans.plan("lowIntensityWalk", reasons);
    }
    if (recentNoTrainingDays >= 2) {
      return app.recommendationPlans.plan("restartFullBody", reasons);
    }
    if (latest.steps < 6000) {
      return app.recommendationPlans.plan("coreWalk", reasons);
    }
    if (lastTraining && isUpperFocus(lastTraining.trainingFocus)) {
      return app.recommendationPlans.plan("lowerBody", [
        ...reasons,
        "最近一次完整训练偏上半身，今天安排下半身更均衡。"
      ]);
    }
    if (lastTraining && isLowerFocus(lastTraining.trainingFocus)) {
      return app.recommendationPlans.plan("upperBody", [
        ...reasons,
        "最近一次完整训练偏下半身，今天安排上半身更均衡。"
      ]);
    }
    if (!trainedLowerRecently) {
      return app.recommendationPlans.plan("lowerSupplement", [
        ...reasons,
        "最近 7 条记录里缺少下半身训练。"
      ]);
    }
    if (!trainedUpperRecently) {
      return app.recommendationPlans.plan("upperSupplement", [
        ...reasons,
        "最近 7 条记录里缺少上半身训练。"
      ]);
    }
    if (recentAverageSteps >= 8000 && recentTrainingDays >= 3) {
      return app.recommendationPlans.plan("recoveryDay", [
        ...reasons,
        "最近步数和训练频率都不错，适合安排轻恢复。"
      ]);
    }

    return app.recommendationPlans.plan(
      "balancedFullBody",
      reasons.length ? reasons : ["当前记录比较平稳，适合做一次中等强度全身训练。"]
    );
  }

  function isStrengthRecord(record) {
    return (
      record.trainingCategory === "strength"
      || app.config.strengthFocusIds.includes(record.trainingFocus)
      || app.config.fullTrainingTypes.includes(record.trainingType)
    );
  }

  function isUpperFocus(focus) {
    return ["upper", "push", "pull", "core"].includes(focus);
  }

  function isLowerFocus(focus) {
    return ["lower", "glutesLegs"].includes(focus);
  }

  app.recommendationEngine = {
    buildTrainingRecommendation
  };
})();
