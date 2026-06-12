(function () {
  const app = window.FitnessApp;

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function todayString() {
    return formatDate(new Date());
  }

  function yesterdayString() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return formatDate(date);
  }

  function previousDateString(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() - 1);
    return formatDate(date);
  }

  app.dateUtils = {
    formatDate,
    todayString,
    yesterdayString,
    previousDateString
  };
})();
