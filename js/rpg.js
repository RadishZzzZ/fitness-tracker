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

  const titles = [
    { level: 1, name: "起步者" },
    { level: 2, name: "行动者" },
    { level: 3, name: "规律建立者" },
    { level: 5, name: "稳定训练者" },
    { level: 8, name: "恢复管理者" },
    { level: 10, name: "长期主义者" }
  ];

  const weeklyChallenges = [
    {
      level: 2,
      id: "walking",
      title: "步行探索",
      description: "本周完成 3 次散步任务",
      rewardExp: 60
    },
    {
      level: 3,
      id: "strength",
      title: "力量基础",
      description: "本周完成 2 次力量训练任务",
      rewardExp: 80
    },
    {
      level: 5,
      id: "balanced",
      title: "均衡一周",
      description: "本周完成 3 次散步、2 次力量训练和 3 次健康晚餐",
      rewardExp: 120
    },
    {
      level: 8,
      id: "recovery",
      title: "恢复管理",
      description: "本周完成 3 次热身拉伸和 3 次散步",
      rewardExp: 140
    }
  ];

  function getTitle(level) {
    return [...titles].reverse().find((item) => level >= item.level).name;
  }

  function getNextUnlock(level) {
    const nextChallenge = weeklyChallenges.find((challenge) => challenge.level > level);
    const nextTitle = titles.find((title) => title.level > level);
    const candidates = [];

    if (nextChallenge) {
      candidates.push({
        level: nextChallenge.level,
        text: `解锁周挑战“${nextChallenge.title}”`
      });
    }
    if (nextTitle) {
      candidates.push({
        level: nextTitle.level,
        text: `获得称号“${nextTitle.name}”`
      });
    }

    candidates.sort((a, b) => a.level - b.level);
    return candidates[0] || {
      level: level + 1,
      text: "继续积累经验和稳定习惯"
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
    day.trainingTarget = normalizeTrainingTarget(day.trainingTarget);
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
      && isStrengthRecord(yesterday)
    ) {
      day.trainingTarget = "lightRecovery";
      return day.trainingTarget;
    }

    const lastStrength = earlierRecords.find(
      (record) => isStrengthRecord(record)
    );

    if (lastStrength && ["upper", "push", "pull", "core"].includes(lastStrength.trainingFocus)) {
      day.trainingTarget = "lower";
    } else if (lastStrength && ["lower", "glutesLegs"].includes(lastStrength.trainingFocus)) {
      day.trainingTarget = "upper";
    } else {
      day.trainingTarget = "full";
    }

    return day.trainingTarget;
  }

  function normalizeTrainingTarget(target) {
    const legacyMap = {
      轻恢复: "lightRecovery",
      散步: "walk",
      上半身: "upper",
      下半身: "lower",
      全身: "full",
      休息: "rest"
    };
    return legacyMap[target] || target || "";
  }

  function isStrengthRecord(record) {
    return (
      record.trainingCategory === "strength"
      || app.config.strengthFocusIds.includes(record.trainingFocus)
      || app.config.fullTrainingTypes.includes(record.trainingType)
    );
  }

  function isRecoveryTarget(target) {
    return target === "lightRecovery" || target === "walk";
  }

  function isRecoveryRecord(record) {
    return (
      record.trainingCategory === "recovery"
      || app.config.recoveryFocusIds.includes(record.trainingFocus)
      || record.trainingFocus === "walk"
      || ["轻恢复", "散步"].includes(record.trainingType)
    );
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
      if (isRecoveryTarget(trainingTarget)) {
        return (
          isRecoveryRecord(record)
          && record.trainingCompletion === "完整"
        );
      }
      return (
        record.trainingFocus === trainingTarget
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

  function processLevelRewards(state, previousLevel) {
    const currentLevel = getLevelProgress(state.totalExp).level;
    const newMilestones = [];
    state.rewardedMilestones = Array.isArray(state.rewardedMilestones)
      ? state.rewardedMilestones
      : [];
    state.recoveryTokens = Number.isFinite(state.recoveryTokens) ? state.recoveryTokens : 0;

    // 每达到 5 的倍数等级，发放一张连续打卡保护券。
    for (let milestone = 5; milestone <= currentLevel; milestone += 5) {
      if (!state.rewardedMilestones.includes(milestone)) {
        state.rewardedMilestones.push(milestone);
        state.recoveryTokens += 1;
        newMilestones.push(milestone);
      }
    }

    state.highestLevelSeen = Math.max(state.highestLevelSeen || 1, currentLevel);
    return {
      leveledUp: currentLevel > previousLevel,
      previousLevel,
      currentLevel,
      newMilestones
    };
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
    while (isActiveStreakDate(state, getDateOffset(offset))) {
      streak += 1;
      offset += 1;
    }

    return streak;
  }

  function isActiveStreakDate(state, date) {
    return (
      getCompletedTaskIds(state, date).length > 0
      || (Array.isArray(state.protectedDates) && state.protectedDates.includes(date))
    );
  }

  function applyStreakProtection(state) {
    state.protectedDates = Array.isArray(state.protectedDates) ? state.protectedDates : [];
    const today = app.dateUtils.todayString();
    if (getCompletedTaskIds(state, today).length === 0 || state.recoveryTokens <= 0) {
      return "";
    }

    const yesterday = app.dateUtils.previousDateString(today);
    const dayBeforeYesterday = app.dateUtils.previousDateString(yesterday);
    const missedYesterday = getCompletedTaskIds(state, yesterday).length === 0;
    const hadPreviousStreak = isActiveStreakDate(state, dayBeforeYesterday);

    if (
      missedYesterday
      && hadPreviousStreak
      && !state.protectedDates.includes(yesterday)
    ) {
      state.protectedDates.push(yesterday);
      state.recoveryTokens -= 1;
      return yesterday;
    }

    return "";
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
            && !isRecoveryTarget(normalizeTrainingTarget(state.taskHistory[date].trainingTarget))
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

  function getWeekDates() {
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return app.dateUtils.formatDate(date);
    });
  }

  function getWeekKey() {
    return getWeekDates()[0];
  }

  function getCurrentChallenge(level) {
    return [...weeklyChallenges].reverse().find((challenge) => level >= challenge.level) || null;
  }

  function getWeeklyChallengeStatus(state, level) {
    const challenge = getCurrentChallenge(level);
    if (!challenge) {
      return {
        locked: true,
        unlockLevel: 2,
        title: "周挑战尚未解锁",
        description: "达到 Lv. 2 后解锁第一个周挑战。",
        rewardExp: 0,
        completed: false,
        progressText: "未解锁"
      };
    }

    const dates = getWeekDates();
    const counts = {
      walk: 0,
      strength: 0,
      healthyDinner: 0,
      warmupCooldown: 0
    };

    dates.forEach((date) => {
      const ids = getCompletedTaskIds(state, date);
      if (ids.includes("walk")) {
        counts.walk += 1;
      }
      if (ids.includes("healthyDinner")) {
        counts.healthyDinner += 1;
      }
      if (ids.includes("warmupCooldown")) {
        counts.warmupCooldown += 1;
      }
      if (
        ids.includes("dynamicTraining")
        && state.taskHistory[date]
        && !isRecoveryTarget(normalizeTrainingTarget(state.taskHistory[date].trainingTarget))
      ) {
        counts.strength += 1;
      }
    });

    let completed = false;
    let progressText = "";
    if (challenge.id === "walking") {
      completed = counts.walk >= 3;
      progressText = `${Math.min(counts.walk, 3)} / 3 次散步`;
    } else if (challenge.id === "strength") {
      completed = counts.strength >= 2;
      progressText = `${Math.min(counts.strength, 2)} / 2 次力量训练`;
    } else if (challenge.id === "balanced") {
      completed = counts.walk >= 3 && counts.strength >= 2 && counts.healthyDinner >= 3;
      progressText = `散步 ${Math.min(counts.walk, 3)}/3 · 力量 ${Math.min(counts.strength, 2)}/2 · 晚餐 ${Math.min(counts.healthyDinner, 3)}/3`;
    } else {
      completed = counts.warmupCooldown >= 3 && counts.walk >= 3;
      progressText = `热身拉伸 ${Math.min(counts.warmupCooldown, 3)}/3 · 散步 ${Math.min(counts.walk, 3)}/3`;
    }

    const weekKey = getWeekKey();
    state.weeklyRewards = state.weeklyRewards && typeof state.weeklyRewards === "object"
      ? state.weeklyRewards
      : {};
    const rewardedIds = Array.isArray(state.weeklyRewards[weekKey])
      ? state.weeklyRewards[weekKey]
      : [];

    return {
      ...challenge,
      locked: false,
      completed,
      rewarded: rewardedIds.includes(challenge.id),
      progressText,
      weekKey
    };
  }

  function settleWeeklyChallenge(state) {
    state.weeklyRewards = state.weeklyRewards && typeof state.weeklyRewards === "object"
      ? state.weeklyRewards
      : {};
    const level = getLevelProgress(state.totalExp).level;
    const status = getWeeklyChallengeStatus(state, level);
    if (status.locked || !status.completed || status.rewarded) {
      return null;
    }

    if (!Array.isArray(state.weeklyRewards[status.weekKey])) {
      state.weeklyRewards[status.weekKey] = [];
    }
    state.weeklyRewards[status.weekKey].push(status.id);
    state.totalExp += status.rewardExp;
    return status;
  }

  app.rpg = {
    getLevelProgress,
    getTitle,
    getNextUnlock,
    getCompletedTaskIds,
    ensureDay,
    isTaskCompleted,
    completeTask,
    getTrainingTarget,
    settleTasksFromRecord,
    processLevelRewards,
    getStreak,
    applyStreakProtection,
    getRecentSevenDayStats,
    getHabitRecommendation,
    getWeeklyChallengeStatus,
    settleWeeklyChallenge
  };
})();
