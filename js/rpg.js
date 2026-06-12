(function () {
  const app = window.FitnessApp;

  function getLevelProgress(totalExp) {
    let level = 1;
    let expInLevel = Math.max(0, totalExp);

    // 每次升级都扣除当前等级所需经验，剩余值就是本级经验。
    while (expInLevel >= level * 100) {
      expInLevel -= level * 100;
      level += 1;
    }

    const requiredExp = level * 100;
    return {
      level,
      expInLevel,
      requiredExp,
      remainingExp: requiredExp - expInLevel,
      progressPercent: Math.min(100, Math.round((expInLevel / requiredExp) * 100))
    };
  }

  function getCompletedTaskIds(state, date) {
    const day = state.taskHistory[date];
    const completedIds = day && Array.isArray(day.completedTaskIds) ? day.completedTaskIds : [];
    const currentTaskIds = app.config.dailyTasks.map((task) => task.id);
    return completedIds.filter((taskId) => currentTaskIds.includes(taskId));
  }

  function ensureDay(state, date) {
    if (!state.taskHistory[date]) {
      state.taskHistory[date] = {
        completedTaskIds: [],
        expEarned: 0,
        trainingTarget: ""
      };
    }

    const day = state.taskHistory[date];
    if (!Array.isArray(day.completedTaskIds)) {
      day.completedTaskIds = [];
    }
    if (!Number.isFinite(day.expEarned)) {
      day.expEarned = 0;
    }
    return day;
  }

  function isTaskCompleted(state, date, taskId) {
    return getCompletedTaskIds(state, date).includes(taskId);
  }

  function completeTask(state, date, taskId) {
    const task = app.config.dailyTasks.find((item) => item.id === taskId);
    if (!task || isTaskCompleted(state, date, taskId)) {
      return false;
    }

    const day = ensureDay(state, date);
    day.completedTaskIds.push(taskId);
    day.expEarned += task.exp;
    state.totalExp += task.exp;
    return true;
  }

  function getTrainingTarget(state, date, records) {
    const day = ensureDay(state, date);
    if (day.trainingTarget) {
      return day.trainingTarget;
    }

    const earlierRecords = app.storage
      .sortRecords(records)
      .filter((record) => record.date < date);
    const yesterday = earlierRecords.find(
      (record) => record.date === app.dateUtils.previousDateString(date)
    );

    // 昨天做过完整力量训练时，今天优先恢复。
    if (
      yesterday
      && yesterday.trainingCompletion === "完整"
      && app.config.fullTrainingTypes.includes(yesterday.trainingType)
    ) {
      day.trainingTarget = "轻恢复";
      return day.trainingTarget;
    }

    const lastStrength = earlierRecords.find(
      (record) => app.config.fullTrainingTypes.includes(record.trainingType)
    );

    if (lastStrength && lastStrength.trainingType === "上半身") {
      day.trainingTarget = "下半身";
    } else if (lastStrength && lastStrength.trainingType === "下半身") {
      day.trainingTarget = "上半身";
    } else {
      day.trainingTarget = "全身";
    }

    return day.trainingTarget;
  }

  function taskMatchesRecord(taskId, record, trainingTarget) {
    if (taskId === "activity") {
      return record.steps >= 6000;
    }
    if (taskId === "walk") {
      return record.walkMinutes >= 20;
    }
    if (taskId === "warmupCooldown") {
      return record.warmupCooldown === true;
    }
    if (taskId === "healthyDinner") {
      return record.dinnerQuality === "健康";
    }
    if (taskId === "dynamicTraining") {
      if (trainingTarget === "轻恢复") {
        return (
          ["轻恢复", "散步"].includes(record.trainingType)
          && record.trainingCompletion === "完整"
        );
      }
      return (
        record.trainingType === trainingTarget
        && record.trainingCompletion === "完整"
      );
    }
    return false;
  }

  function settleTasksFromRecord(state, record, records) {
    if (!record) {
      return [];
    }

    const trainingTarget = getTrainingTarget(state, record.date, records);
    const newlyCompleted = [];

    // 保存记录时自动检查所有任务，只奖励尚未完成且满足条件的任务。
    app.config.dailyTasks.forEach((task) => {
      if (
        !isTaskCompleted(state, record.date, task.id)
        && taskMatchesRecord(task.id, record, trainingTarget)
        && completeTask(state, record.date, task.id)
      ) {
        newlyCompleted.push(task);
      }
    });

    return newlyCompleted;
  }

  function getDateOffset(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return app.dateUtils.formatDate(date);
  }

  function getStreak(state) {
    const today = app.dateUtils.todayString();
    let offset = getCompletedTaskIds(state, today).length > 0 ? 0 : 1;
    let streak = 0;

    // 今天还没完成任务时，昨天的连续记录仍然有效；若昨天也空缺则归零。
    while (getCompletedTaskIds(state, getDateOffset(offset)).length > 0) {
      streak += 1;
      offset += 1;
    }

    return streak;
  }

  function getRecentSevenDayStats(state) {
    let completedTasks = 0;
    let earnedExp = 0;
    let exerciseTasks = 0;
    let strengthTrainingTasks = 0;
    const taskCounts = {};

    for (let offset = 0; offset < 7; offset += 1) {
      const date = getDateOffset(offset);
      const completedIds = getCompletedTaskIds(state, date);

      completedTasks += completedIds.length;

      completedIds.forEach((taskId) => {
        taskCounts[taskId] = (taskCounts[taskId] || 0) + 1;
        const task = app.config.dailyTasks.find((item) => item.id === taskId);
        if (task) {
          earnedExp += task.exp;
          if (task.category === "exercise") {
            exerciseTasks += 1;
          }
          if (
            taskId === "dynamicTraining"
            && state.taskHistory[date]
            && state.taskHistory[date].trainingTarget !== "轻恢复"
          ) {
            strengthTrainingTasks += 1;
          }
        }
      });
    }

    return {
      completedTasks,
      earnedExp,
      exerciseTasks,
      strengthTrainingTasks,
      taskCounts
    };
  }

  function getHabitRecommendation(recentStats) {
    if (recentStats.strengthTrainingTasks < 2) {
      return "本周力量训练还不到 2 次，可以补一次上肢或下肢训练。";
    }
    if ((recentStats.taskCounts.walk || 0) < 3) {
      return "本周散步次数偏少，可以安排一次轻松的 20 分钟散步。";
    }
    if ((recentStats.taskCounts.healthyDinner || 0) < 3) {
      return "本周健康晚餐次数偏少，接下来可以注意晚餐质量。";
    }
    return "最近 7 天整体完成得很好，继续保持现在的节奏。";
  }

  app.rpg = {
    getLevelProgress,
    getCompletedTaskIds,
    ensureDay,
    isTaskCompleted,
    completeTask,
    getTrainingTarget,
    settleTasksFromRecord,
    getStreak,
    getRecentSevenDayStats,
    getHabitRecommendation
  };
})();
