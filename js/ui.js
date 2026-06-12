(function () {
  const app = window.FitnessApp;

  const elements = {
    form: document.querySelector("#recordForm"),
    formTitle: document.querySelector("#form-title"),
    recordIdInput: document.querySelector("#recordId"),
    dateInput: document.querySelector("#date"),
    weightInput: document.querySelector("#weight"),
    stepsInput: document.querySelector("#steps"),
    trainedInput: document.querySelector("#trained"),
    trainingTypeInput: document.querySelector("#trainingType"),
    dinnerTypeInput: document.querySelector("#dinnerType"),
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
    aiAdvice: document.querySelector("#aiAdvice")
  };

  let records = [];
  let currentRecommendation = null;

  function init() {
    records = app.storage.loadRecords();
    resetForm();
    bindEvents();
    render();
  }

  function bindEvents() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.trainedInput.addEventListener("change", syncTrainingType);
    elements.trainingTypeInput.addEventListener("change", () => {
      elements.trainedInput.checked = elements.trainingTypeInput.value !== "休息";
    });
    elements.cancelEditButton.addEventListener("click", resetForm);
    elements.clearAllButton.addEventListener("click", clearAllRecords);
    elements.historyBody.addEventListener("click", handleHistoryClick);
    elements.aiRecommendButton.addEventListener("click", handleAiRecommendation);
  }

  function render() {
    updateStats();
    updateRecommendation();
    renderHistory();
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
    syncTrainingType();
    const record = getFormRecord();
    if (validateRecord(record)) {
      upsertRecord(record);
    }
  }

  function getFormRecord() {
    return {
      id: elements.recordIdInput.value || app.storage.createId(),
      date: elements.dateInput.value,
      weight: Number(elements.weightInput.value),
      steps: Number(elements.stepsInput.value),
      trained: elements.trainedInput.checked,
      trainingType: elements.trainingTypeInput.value,
      dinnerType: elements.dinnerTypeInput.value,
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
    elements.trainedInput.checked = record.trained;
    elements.trainingTypeInput.value = record.trainingType;
    elements.dinnerTypeInput.value = record.dinnerType;
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

  function syncTrainingType() {
    if (!elements.trainedInput.checked) {
      elements.trainingTypeInput.value = "休息";
    } else if (elements.trainingTypeInput.value === "休息") {
      elements.trainingTypeInput.value = "散步";
    }
  }

  function resetForm() {
    elements.form.reset();
    elements.recordIdInput.value = "";
    elements.dateInput.value = app.dateUtils.todayString();
    elements.trainedInput.checked = false;
    elements.trainingTypeInput.value = "休息";
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

  app.ui = {
    init
  };
})();
