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
    trainingTypeInput: document.querySelector("#trainingType"),
    trainingMinutesInput: document.querySelector("#trainingMinutes"),
    trainingCompletionInput: document.querySelector("#trainingCompletion"),
    trainingRpeInput: document.querySelector("#trainingRpe"),
    warmupCooldownInput: document.querySelector("#warmupCooldown"),
    dinnerTypeInput: document.querySelector("#dinnerType"),
    dinnerQualityInput: document.querySelector("#dinnerQuality"),
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
    expValue: document.querySelector("#expValue"),
    remainingExpValue: document.querySelector("#remainingExpValue"),
    expProgress: document.querySelector("#expProgress"),
    expProgressBar: document.querySelector("#expProgressBar"),
    streakValue: document.querySelector("#streakValue"),
    habitRecommendation: document.querySelector("#habitRecommendation"),
    dailyTaskProgress: document.querySelector("#dailyTaskProgress"),
    dailyTaskList: document.querySelector("#dailyTaskList"),
    taskRewardMessage: document.querySelector("#taskRewardMessage"),
    recentTaskCount: document.querySelector("#recentTaskCount"),
    recentExpCount: document.querySelector("#recentExpCount"),
    recentExerciseCount: document.querySelector("#recentExerciseCount")
  };

  let records = [];
  let rpgState = null;
  let currentRecommendation = null;

  function init() {
    records = app.storage.loadRecords();
    rpgState = app.storage.loadRpgState();
    reconcileExistingRecords();
    resetForm();
    bindEvents();
    render();
  }

  function reconcileExistingRecords() {
    // 旧版记录加载后也按新规则结算一次；已完成任务不会重复获得经验。
    [...records]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((record) => {
        app.rpg.settleTasksFromRecord(rpgState, record, records);
      });

    app.storage.saveRecords(records);
    app.storage.saveRpgState(rpgState);
  }

  function bindEvents() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.trainingTypeInput.addEventListener("change", () => {
      if (elements.trainingTypeInput.value === "休息") {
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
    elements.expValue.textContent = `${level.expInLevel} / ${level.requiredExp} exp`;
    elements.remainingExpValue.textContent = `还差 ${level.remainingExp} exp`;
    elements.expProgressBar.style.width = `${level.progressPercent}%`;
    elements.expProgress.setAttribute("aria-valuemax", String(level.requiredExp));
    elements.expProgress.setAttribute("aria-valuenow", String(level.expInLevel));
    elements.streakValue.textContent = `连续 ${app.rpg.getStreak(rpgState)} 天`;
    elements.dailyTaskProgress.textContent = `${completedIds.length} / ${app.config.dailyTasks.length} 完成`;
    elements.recentTaskCount.textContent = `${recentStats.completedTasks} 个`;
    elements.recentExpCount.textContent = `${recentStats.earnedExp} exp`;
    elements.recentExerciseCount.textContent = `${recentStats.exerciseTasks} 次`;
    elements.habitRecommendation.textContent = app.rpg.getHabitRecommendation(recentStats);

    renderDailyTasks(today, trainingTarget);
    app.storage.saveRpgState(rpgState);
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
      return `今日训练：${trainingTarget}`;
    }
    return task.name;
  }

  function getTaskRequirement(task, trainingTarget) {
    const requirements = {
      activity: "当天记录步数达到 6000",
      walk: "当天记录散步时间达到 20 分钟",
      dynamicTraining: `训练类型为${trainingTarget}，并选择完整完成`,
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
        <td>${escapeHtml(record.trainingType)}</td>
        <td>${formatTrainingDetails(record)}</td>
        <td>${escapeHtml(record.dinnerType)}</td>
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
    const trained = elements.trainingTypeInput.value !== "休息";
    return {
      id: elements.recordIdInput.value || app.storage.createId(),
      date: elements.dateInput.value,
      weight: Number(elements.weightInput.value),
      steps: Number(elements.stepsInput.value),
      walkMinutes: Number(elements.walkMinutesInput.value),
      trained,
      trainingType: elements.trainingTypeInput.value,
      trainingMinutes: Number(elements.trainingMinutesInput.value),
      trainingCompletion: elements.trainingCompletionInput.value,
      trainingRpe: Number(elements.trainingRpeInput.value),
      warmupCooldown: elements.warmupCooldownInput.checked,
      dinnerType: elements.dinnerTypeInput.value,
      dinnerQuality: elements.dinnerQualityInput.value,
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

    app.storage.saveRecords(records);
    const completedTasks = app.rpg.settleTasksFromRecord(rpgState, record, records);
    app.storage.saveRpgState(rpgState);
    showTaskRewards(completedTasks);
    resetForm();
    render();
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
    elements.trainingTypeInput.value = record.trainingType;
    elements.trainingMinutesInput.value = record.trainingMinutes || 0;
    elements.trainingCompletionInput.value = record.trainingCompletion || (record.trained ? "完整" : "未训练");
    elements.trainingRpeInput.value = String(record.trainingRpe || 0);
    elements.warmupCooldownInput.checked = record.warmupCooldown === true;
    elements.dinnerTypeInput.value = record.dinnerType;
    elements.dinnerQualityInput.value = record.dinnerQuality || inferDinnerQuality(record.dinnerType);
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
    elements.trainingTypeInput.value = "休息";
    elements.walkMinutesInput.value = "0";
    elements.trainingMinutesInput.value = "0";
    elements.trainingCompletionInput.value = "未训练";
    elements.trainingRpeInput.value = "0";
    elements.warmupCooldownInput.checked = false;
    elements.dinnerQualityInput.value = "健康";
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

  function inferDinnerQuality(dinnerType) {
    if (dinnerType === "清淡") {
      return "健康";
    }
    if (app.config.heavyDinners.includes(dinnerType)) {
      return "放纵";
    }
    return "普通";
  }

  function showTaskRewards(tasks) {
    if (!tasks.length) {
      elements.taskRewardMessage.classList.add("hidden");
      elements.taskRewardMessage.textContent = "";
      return;
    }

    const total = tasks.reduce((sum, task) => sum + task.exp, 0);
    elements.taskRewardMessage.textContent = `自动完成 ${tasks.length} 个任务，获得 ${total} exp。`;
    elements.taskRewardMessage.classList.remove("hidden");
  }

  app.ui = {
    init
  };
})();
