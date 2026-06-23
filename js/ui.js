(function () {
  const app = window.FitnessApp;

  const elements = {
    form: document.querySelector("#recordForm"),
    formTitle: document.querySelector("#form-title"),
    recordIdInput: document.querySelector("#recordId"),
    dateInput: document.querySelector("#date"),
    weightInput: document.querySelector("#weight"),
    stepsInput: document.querySelector("#steps"),
    walkMinutesInput: document.querySelector("#walkMinutes"),
    trainingCategoryInput: document.querySelector("#trainingCategory"),
    trainingFocusInput: document.querySelector("#trainingFocus"),
    trainingMinutesInput: document.querySelector("#trainingMinutes"),
    trainingCompletionInput: document.querySelector("#trainingCompletion"),
    trainingRpeInput: document.querySelector("#trainingRpe"),
    warmupCooldownInput: document.querySelector("#warmupCooldown"),
    dinnerQualityInput: document.querySelector("#dinnerQuality"),
    dinnerTagList: document.querySelector("#dinnerTagList"),
    fatigueInput: document.querySelector("#fatigue"),
    sorenessInput: document.querySelector("#soreness"),
    noteInput: document.querySelector("#note"),
    submitButton: document.querySelector("#submitButton"),
    cancelEditButton: document.querySelector("#cancelEditButton"),
    clearAllButton: document.querySelector("#clearAllButton"),
    historyBody: document.querySelector("#historyBody"),
    emptyState: document.querySelector("#emptyState"),
    recordCount: document.querySelector("#recordCount"),
    adviceList: document.querySelector("#adviceList"),
    recommendationTitle: document.querySelector("#recommendationTitle"),
    recommendationDuration: document.querySelector("#recommendationDuration"),
    recommendationFocus: document.querySelector("#recommendationFocus"),
    warmupList: document.querySelector("#warmupList"),
    exerciseList: document.querySelector("#exerciseList"),
    cooldownList: document.querySelector("#cooldownList"),
    intensityTip: document.querySelector("#intensityTip"),
    recoveryTip: document.querySelector("#recoveryTip"),
    avgSteps: document.querySelector("#avgSteps"),
    trainingDays: document.querySelector("#trainingDays"),
    weightChange: document.querySelector("#weightChange"),
    heavyDinnerCount: document.querySelector("#heavyDinnerCount"),
    aiRecommendButton: document.querySelector("#aiRecommendButton"),
    aiStatus: document.querySelector("#aiStatus"),
    aiAdvice: document.querySelector("#aiAdvice"),
    levelValue: document.querySelector("#levelValue"),
    titleValue: document.querySelector("#titleValue"),
    expValue: document.querySelector("#expValue"),
    remainingExpValue: document.querySelector("#remainingExpValue"),
    expProgress: document.querySelector("#expProgress"),
    expProgressBar: document.querySelector("#expProgressBar"),
    streakValue: document.querySelector("#streakValue"),
    recoveryTokenValue: document.querySelector("#recoveryTokenValue"),
    nextUnlockValue: document.querySelector("#nextUnlockValue"),
    habitRecommendation: document.querySelector("#habitRecommendation"),
    dailyTaskProgress: document.querySelector("#dailyTaskProgress"),
    dailyTaskList: document.querySelector("#dailyTaskList"),
    taskRewardMessage: document.querySelector("#taskRewardMessage"),
    recentTaskCount: document.querySelector("#recentTaskCount"),
    recentExpCount: document.querySelector("#recentExpCount"),
    recentExerciseCount: document.querySelector("#recentExerciseCount"),
    weeklyChallengeName: document.querySelector("#weeklyChallengeName"),
    weeklyChallengeDescription: document.querySelector("#weeklyChallengeDescription"),
    weeklyChallengeProgress: document.querySelector("#weeklyChallengeProgress"),
    weeklyChallengeState: document.querySelector("#weeklyChallengeState"),
    weeklyChallengeReward: document.querySelector("#weeklyChallengeReward"),
    levelUpDialog: document.querySelector("#levelUpDialog"),
    levelUpTitle: document.querySelector("#levelUpTitle"),
    levelUpMessage: document.querySelector("#levelUpMessage"),
    levelUpRewards: document.querySelector("#levelUpRewards"),
    closeLevelUpButton: document.querySelector("#closeLevelUpButton")
  };

  let records = [];
  let rpgState = null;
  let currentRecommendation = null;

  function init() {
    records = app.storage.loadRecords();
    rpgState = app.storage.loadRpgState();
    reconcileExistingRecords();
    renderConfigOptions();
    resetForm();
    bindEvents();
    render();
  }

  function reconcileExistingRecords() {
    const previousLevel = app.rpg.getLevelProgress(rpgState.totalExp).level;
    // 旧版记录加载后也按新规则结算一次；已完成任务不会重复获得经验。
    [...records]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((record) => {
        app.rpg.settleTasksFromRecord(rpgState, record, records);
      });

    app.rpg.applyStreakProtection(rpgState);
    app.rpg.settleWeeklyChallenge(rpgState);
    app.rpg.processLevelRewards(rpgState, previousLevel);
    app.storage.saveRecords(records);
    app.storage.saveRpgState(rpgState);
  }

  function bindEvents() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.trainingCategoryInput.addEventListener("change", () => {
      renderTrainingFocusOptions(elements.trainingCategoryInput.value);
      if (elements.trainingCategoryInput.value === "rest") {
        elements.trainingCompletionInput.value = "未训练";
        elements.trainingRpeInput.value = "0";
        elements.trainingMinutesInput.value = "0";
      } else if (elements.trainingCompletionInput.value === "未训练") {
        elements.trainingCompletionInput.value = "完整";
        elements.trainingRpeInput.value = "6";
      }
    });
    elements.cancelEditButton.addEventListener("click", resetForm);
    elements.clearAllButton.addEventListener("click", clearAllRecords);
    elements.historyBody.addEventListener("click", handleHistoryClick);
    elements.aiRecommendButton.addEventListener("click", handleAiRecommendation);
    elements.dailyTaskList.addEventListener("click", handleDailyTaskClick);
    elements.closeLevelUpButton.addEventListener("click", () => {
      elements.levelUpDialog.close();
    });
  }

  function renderConfigOptions() {
    elements.trainingCategoryInput.innerHTML = app.config.trainingCategories
      .map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`)
      .join("");
    renderTrainingFocusOptions("rest");

    elements.dinnerQualityInput.innerHTML = app.config.dinnerQualities
      .map((quality) => `<option value="${escapeHtml(quality)}">${escapeHtml(quality)}</option>`)
      .join("");

    elements.dinnerTagList.innerHTML = app.config.dinnerTags
      .map((tag) => `
        <label class="tag-option">
          <input type="checkbox" name="dinnerTags" value="${escapeHtml(tag)}">
          <span>${escapeHtml(tag)}</span>
        </label>
      `)
      .join("");
  }

  function renderTrainingFocusOptions(category, selectedFocus = "") {
    const options = app.config.trainingFocusByCategory[category] || [];
    elements.trainingFocusInput.innerHTML = options
      .map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`)
      .join("");
    elements.trainingFocusInput.value = selectedFocus || (options[0] ? options[0].id : "");
  }

  function render() {
    updateRpg();
    updateStats();
    updateRecommendation();
    renderHistory();
  }

  function updateRpg() {
    const today = app.dateUtils.todayString();
    const trainingTarget = app.rpg.getTrainingTarget(rpgState, today, records);
    const level = app.rpg.getLevelProgress(rpgState.totalExp);
    const completedIds = app.rpg.getCompletedTaskIds(rpgState, today);
    const recentStats = app.rpg.getRecentSevenDayStats(rpgState);

    elements.levelValue.textContent = `Lv. ${level.level}`;
    elements.titleValue.textContent = app.rpg.getTitle(level.level);
    elements.expValue.textContent = `${level.expInLevel} / ${level.requiredExp} exp`;
    elements.remainingExpValue.textContent = `还差 ${level.remainingExp} exp`;
    elements.expProgressBar.style.width = `${level.progressPercent}%`;
    elements.expProgress.setAttribute("aria-valuemax", String(level.requiredExp));
    elements.expProgress.setAttribute("aria-valuenow", String(level.expInLevel));
    elements.streakValue.textContent = `连续 ${app.rpg.getStreak(rpgState)} 天`;
    elements.recoveryTokenValue.textContent = `${rpgState.recoveryTokens} 张`;
    const nextUnlock = app.rpg.getNextUnlock(level.level);
    elements.nextUnlockValue.textContent = `Lv. ${nextUnlock.level}：${nextUnlock.text}`;
    elements.dailyTaskProgress.textContent = `${completedIds.length} / ${app.config.dailyTasks.length} 完成`;
    elements.recentTaskCount.textContent = `${recentStats.completedTasks} 个`;
    elements.recentExpCount.textContent = `${recentStats.earnedExp} exp`;
    elements.recentExerciseCount.textContent = `${recentStats.exerciseTasks} 次`;
    elements.habitRecommendation.textContent = app.rpg.getHabitRecommendation(recentStats);

    renderDailyTasks(today, trainingTarget);
    renderWeeklyChallenge(level.level);
    app.storage.saveRpgState(rpgState);
  }

  function renderWeeklyChallenge(level) {
    const challenge = app.rpg.getWeeklyChallengeStatus(rpgState, level);
    elements.weeklyChallengeName.textContent = challenge.title;
    elements.weeklyChallengeDescription.textContent = challenge.description;
    elements.weeklyChallengeProgress.textContent = challenge.progressText;

    if (challenge.locked) {
      elements.weeklyChallengeReward.textContent = "";
      elements.weeklyChallengeState.textContent = `Lv. ${challenge.unlockLevel} 解锁`;
    } else {
      elements.weeklyChallengeReward.textContent = `完成奖励 +${challenge.rewardExp} exp`;
      elements.weeklyChallengeState.textContent = challenge.rewarded
        ? "已领取"
        : challenge.completed
          ? "待结算"
          : "进行中";
    }
  }

  function renderDailyTasks(today, trainingTarget) {
    elements.dailyTaskList.innerHTML = "";

    app.config.dailyTasks.forEach((task) => {
      const completed = app.rpg.isTaskCompleted(rpgState, today, task.id);
      const item = document.createElement("article");
      item.className = `daily-task${completed ? " completed" : ""}`;
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(getTaskName(task, trainingTarget))}</strong>
          <small>${escapeHtml(getTaskRequirement(task, trainingTarget))}</small>
          <span>+${task.exp} exp</span>
        </div>
        <button
          type="button"
          data-task-id="${task.id}"
          ${completed ? "disabled" : ""}
        >${completed ? "已完成" : "去记录"}</button>
      `;
      elements.dailyTaskList.appendChild(item);
    });
  }

  function getTaskName(task, trainingTarget) {
    if (task.id === "dynamicTraining") {
      return `今日训练：${getTrainingFocusLabel(trainingTarget)}`;
    }
    return task.name;
  }

  function getTaskRequirement(task, trainingTarget) {
    const targetLabel = getTrainingFocusLabel(trainingTarget);
    const requirements = {
      activity: "当天记录步数达到 6000",
      walk: "当天记录散步时间达到 20 分钟",
      dynamicTraining: `训练重点为${targetLabel}，并选择完整完成`,
      warmupCooldown: "在当天记录中勾选已完成热身和拉伸",
      healthyDinner: "当天晚饭质量选择健康"
    };
    return requirements[task.id] || "";
  }

  function updateStats() {
    const summary = app.stats.summarizeRecent(records);
    elements.avgSteps.textContent = summary.averageSteps.toLocaleString("zh-CN");
    elements.trainingDays.textContent = `${summary.trainingDays} 天`;
    elements.weightChange.textContent = summary.weightChange;
    elements.heavyDinnerCount.textContent = `${summary.heavyDinnerCount} 次`;
  }

  function updateRecommendation() {
    currentRecommendation = app.recommendationEngine.buildTrainingRecommendation(records);
    elements.recommendationTitle.textContent = currentRecommendation.title;
    elements.recommendationDuration.textContent = currentRecommendation.duration;
    elements.recommendationFocus.textContent = currentRecommendation.focus;
    elements.intensityTip.textContent = currentRecommendation.intensity;
    elements.recoveryTip.textContent = currentRecommendation.recovery;
    renderList(elements.warmupList, currentRecommendation.warmup);
    renderList(elements.exerciseList, currentRecommendation.exercises);
    renderList(elements.cooldownList, currentRecommendation.cooldown);
    renderList(elements.adviceList, currentRecommendation.reasons);
  }

  function renderHistory() {
    const sorted = app.storage.sortRecords(records);
    elements.historyBody.innerHTML = "";

    sorted.forEach((record) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(record.date)}</td>
        <td>${record.weight.toFixed(1)} kg</td>
        <td>${record.steps.toLocaleString("zh-CN")}</td>
        <td>${record.trained ? "是" : "否"}</td>
        <td>${escapeHtml(formatTrainingDisplay(record))}</td>
        <td>${formatTrainingDetails(record)}</td>
        <td>${escapeHtml(formatDinnerDisplay(record))}</td>
        <td class="note-cell">${escapeHtml(record.note || "")}</td>
        <td>
          <div class="action-cell">
            <button class="ghost" type="button" data-action="edit" data-id="${record.id}">编辑</button>
            <button class="ghost danger" type="button" data-action="delete" data-id="${record.id}">删除</button>
          </div>
        </td>
      `;
      elements.historyBody.appendChild(row);
    });

    elements.emptyState.classList.toggle("hidden", records.length > 0);
    elements.recordCount.textContent = `${records.length} 条`;
  }

  function renderList(target, items) {
    target.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const record = getFormRecord();
    if (validateRecord(record)) {
      upsertRecord(record);
    }
  }

  function getFormRecord() {
    const trainingCategory = elements.trainingCategoryInput.value;
    const trainingFocus = elements.trainingFocusInput.value;
    const trained = trainingCategory !== "rest";
    return {
      id: elements.recordIdInput.value || app.storage.createId(),
      date: elements.dateInput.value,
      weight: Number(elements.weightInput.value),
      steps: Number(elements.stepsInput.value),
      walkMinutes: Number(elements.walkMinutesInput.value),
      trained,
      trainingCategory,
      trainingFocus,
      trainingType: getTrainingFocusLabel(trainingFocus),
      trainingMinutes: Number(elements.trainingMinutesInput.value),
      trainingCompletion: elements.trainingCompletionInput.value,
      trainingRpe: Number(elements.trainingRpeInput.value),
      warmupCooldown: elements.warmupCooldownInput.checked,
      dinnerQuality: elements.dinnerQualityInput.value,
      dinnerTags: getSelectedDinnerTags(),
      fatigue: elements.fatigueInput.value,
      soreness: elements.sorenessInput.value.trim(),
      note: elements.noteInput.value.trim()
    };
  }

  function validateRecord(record) {
    if (!record.date) {
      alert("请选择日期。");
      return false;
    }
    if (!Number.isFinite(record.weight) || record.weight <= 0) {
      alert("请输入有效体重。");
      return false;
    }
    if (!Number.isFinite(record.steps) || record.steps < 0) {
      alert("请输入有效步数。");
      return false;
    }
    if (!Number.isFinite(record.walkMinutes) || record.walkMinutes < 0) {
      alert("请输入有效散步分钟数。");
      return false;
    }
    if (!Number.isFinite(record.trainingMinutes) || record.trainingMinutes < 0) {
      alert("请输入有效训练时长。");
      return false;
    }
    return true;
  }

  function upsertRecord(record) {
    const existingIndex = records.findIndex((item) => item.id === record.id);
    const sameDateIndex = records.findIndex((item) => item.date === record.date && item.id !== record.id);

    if (sameDateIndex !== -1) {
      const replace = confirm("这个日期已经有记录。是否覆盖该日期的旧记录？");
      if (!replace) {
        return;
      }
      records.splice(sameDateIndex, 1);
    }

    if (existingIndex === -1) {
      records.push(record);
    } else {
      records[existingIndex] = record;
    }

    const previousLevel = app.rpg.getLevelProgress(rpgState.totalExp).level;
    app.storage.saveRecords(records);
    const completedTasks = app.rpg.settleTasksFromRecord(rpgState, record, records);
    const protectedDate = app.rpg.applyStreakProtection(rpgState);
    const completedChallenge = app.rpg.settleWeeklyChallenge(rpgState);
    const levelResult = app.rpg.processLevelRewards(rpgState, previousLevel);
    app.storage.saveRpgState(rpgState);
    showTaskRewards(completedTasks, completedChallenge, protectedDate);
    resetForm();
    render();
    showLevelUp(levelResult);
  }

  function editRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record) {
      return;
    }

    elements.recordIdInput.value = record.id;
    elements.dateInput.value = record.date;
    elements.weightInput.value = record.weight;
    elements.stepsInput.value = record.steps;
    elements.walkMinutesInput.value = record.walkMinutes || 0;
    elements.trainingCategoryInput.value = record.trainingCategory || "rest";
    renderTrainingFocusOptions(elements.trainingCategoryInput.value, record.trainingFocus || "rest");
    elements.trainingMinutesInput.value = record.trainingMinutes || 0;
    elements.trainingCompletionInput.value = record.trainingCompletion || (record.trained ? "完整" : "未训练");
    elements.trainingRpeInput.value = String(record.trainingRpe || 0);
    elements.warmupCooldownInput.checked = record.warmupCooldown === true;
    elements.dinnerQualityInput.value = record.dinnerQuality || "普通";
    setSelectedDinnerTags(record.dinnerTags || []);
    elements.fatigueInput.value = record.fatigue || "中";
    elements.sorenessInput.value = record.soreness || "";
    elements.noteInput.value = record.note || "";
    elements.formTitle.textContent = "编辑记录";
    elements.submitButton.textContent = "更新记录";
    elements.cancelEditButton.classList.remove("hidden");
    elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record) {
      return;
    }

    const ok = confirm(`确定删除 ${record.date} 的记录吗？`);
    if (!ok) {
      return;
    }

    records = records.filter((item) => item.id !== id);
    app.storage.saveRecords(records);
    render();
  }

  function clearAllRecords() {
    if (!records.length) {
      return;
    }

    const ok = confirm("确定清空全部记录吗？这个操作不能撤销。");
    if (!ok) {
      return;
    }

    records = [];
    app.storage.saveRecords(records);
    resetForm();
    render();
  }

  async function handleAiRecommendation() {
    elements.aiRecommendButton.disabled = true;
    elements.aiStatus.textContent = "正在请求本机 AI 代理...";
    elements.aiAdvice.classList.add("hidden");
    elements.aiAdvice.textContent = "";

    try {
      const advice = await app.aiClient.requestAiRecommendation(records, currentRecommendation);
      elements.aiAdvice.textContent = advice;
      elements.aiAdvice.classList.remove("hidden");
      elements.aiStatus.textContent = "AI 建议已生成。";
    } catch (error) {
      elements.aiStatus.textContent = error.message;
    } finally {
      elements.aiRecommendButton.disabled = false;
    }
  }

  function handleDailyTaskClick(event) {
    const button = event.target.closest("button[data-task-id]");
    if (!button || button.disabled) {
      return;
    }

    elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.dateInput.value = app.dateUtils.todayString();
  }

  function handleHistoryClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const { action, id } = button.dataset;
    if (action === "edit") {
      editRecord(id);
    }
    if (action === "delete") {
      deleteRecord(id);
    }
  }

  function resetForm() {
    elements.form.reset();
    elements.recordIdInput.value = "";
    elements.dateInput.value = app.dateUtils.todayString();
    elements.trainingCategoryInput.value = "rest";
    renderTrainingFocusOptions("rest", "rest");
    elements.walkMinutesInput.value = "0";
    elements.trainingMinutesInput.value = "0";
    elements.trainingCompletionInput.value = "未训练";
    elements.trainingRpeInput.value = "0";
    elements.warmupCooldownInput.checked = false;
    elements.dinnerQualityInput.value = "健康";
    setSelectedDinnerTags([]);
    elements.fatigueInput.value = "中";
    elements.formTitle.textContent = "新增记录";
    elements.submitButton.textContent = "保存记录";
    elements.cancelEditButton.classList.add("hidden");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTrainingDetails(record) {
    const details = [];
    if (record.trainingMinutes) {
      details.push(`${record.trainingMinutes} 分钟`);
    }
    if (record.trainingCompletion) {
      details.push(record.trainingCompletion);
    }
    if (record.trainingRpe) {
      details.push(`RPE ${record.trainingRpe}`);
    }
    if (record.warmupCooldown) {
      details.push("含热身拉伸");
    }
    return escapeHtml(details.length ? details.join(" / ") : "暂无");
  }

  function getTrainingCategoryLabel(categoryId) {
    const category = app.config.trainingCategories.find((item) => item.id === categoryId);
    return category ? category.label : "休息";
  }

  function getTrainingFocusLabel(focusId) {
    const allOptions = Object.values(app.config.trainingFocusByCategory).flat();
    const option = allOptions.find((item) => item.id === focusId);
    return option ? option.label : focusId;
  }

  function formatTrainingDisplay(record) {
    const categoryLabel = getTrainingCategoryLabel(record.trainingCategory);
    const focusLabel = getTrainingFocusLabel(record.trainingFocus);
    return categoryLabel === focusLabel ? categoryLabel : `${categoryLabel} / ${focusLabel}`;
  }

  function formatDinnerDisplay(record) {
    const tags = Array.isArray(record.dinnerTags) ? record.dinnerTags : [];
    return tags.length ? `${record.dinnerQuality} / ${tags.join("、")}` : record.dinnerQuality;
  }

  function getSelectedDinnerTags() {
    return [...elements.dinnerTagList.querySelectorAll("input[name='dinnerTags']:checked")]
      .map((input) => input.value);
  }

  function setSelectedDinnerTags(tags) {
    const selected = new Set(tags);
    elements.dinnerTagList.querySelectorAll("input[name='dinnerTags']").forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function showTaskRewards(tasks, challenge, protectedDate) {
    if (!tasks.length && !challenge && !protectedDate) {
      elements.taskRewardMessage.classList.add("hidden");
      elements.taskRewardMessage.textContent = "";
      return;
    }

    const total = tasks.reduce((sum, task) => sum + task.exp, 0);
    const messages = [];
    if (tasks.length) {
      messages.push(`自动完成 ${tasks.length} 个任务，获得 ${total} exp`);
    }
    if (challenge) {
      messages.push(`完成周挑战“${challenge.title}”，获得 ${challenge.rewardExp} exp`);
    }
    if (protectedDate) {
      messages.push(`已使用 1 张保护券守住 ${protectedDate} 的连续打卡`);
    }
    elements.taskRewardMessage.textContent = `${messages.join("；")}。`;
    elements.taskRewardMessage.classList.remove("hidden");
  }

  function showLevelUp(result) {
    if (!result.leveledUp) {
      return;
    }

    const title = app.rpg.getTitle(result.currentLevel);
    const unlock = app.rpg.getNextUnlock(result.currentLevel);
    elements.levelUpTitle.textContent = `达到 Lv. ${result.currentLevel}`;
    elements.levelUpMessage.textContent = `当前称号：${title}`;
    elements.levelUpRewards.innerHTML = "";

    for (let level = result.previousLevel + 1; level <= result.currentLevel; level += 1) {
      const unlockedText = getUnlockedAtLevel(level);
      if (unlockedText) {
        appendLevelReward(unlockedText);
      }
    }
    result.newMilestones.forEach(() => {
      appendLevelReward("获得 1 张连续打卡保护券");
    });
    appendLevelReward(`下一目标：Lv. ${unlock.level}，${unlock.text}`);

    if (typeof elements.levelUpDialog.showModal === "function") {
      elements.levelUpDialog.showModal();
    } else {
      elements.levelUpDialog.setAttribute("open", "");
    }
  }

  function appendLevelReward(text) {
    const li = document.createElement("li");
    li.textContent = text;
    elements.levelUpRewards.appendChild(li);
  }

  function getUnlockedAtLevel(level) {
    const unlocks = {
      2: "解锁周挑战“步行探索”",
      3: "解锁周挑战“力量基础”",
      5: "获得称号“稳定训练者”，解锁“均衡一周”",
      8: "获得称号“恢复管理者”，解锁“恢复管理”",
      10: "获得称号“长期主义者”"
    };
    return unlocks[level] || "";
  }

  app.ui = {
    init
  };
})();
