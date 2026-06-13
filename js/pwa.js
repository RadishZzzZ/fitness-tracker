(function () {
  const app = window.FitnessApp;
  let installPrompt = null;

  function init() {
    const installButton = document.querySelector("#installAppButton");

    if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
      navigator.serviceWorker.register("/service-worker.js").catch((error) => {
        console.warn("离线缓存注册失败。", error);
      });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      installButton.classList.remove("hidden");
    });

    installButton.addEventListener("click", async () => {
      if (!installPrompt) {
        return;
      }

      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installButton.classList.add("hidden");
    });

    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      installButton.classList.add("hidden");
    });
  }

  app.pwa = {
    init
  };
})();
