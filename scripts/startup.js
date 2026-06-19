(() => {
  const api = globalThis.browser || globalThis.chrome;

  if (!api?.runtime || !api?.tabs) {
    return;
  }

  const extensionPage = api.runtime.getURL("newtab.html");
  const browserHomeUrls = new Set([
    "about:home",
    "about:newtab",
    "chrome://newtab/",
    "chrome://new-tab-page/",
    "chrome://new-tab-page-third-party/"
  ]);

  const usesPromiseApi = typeof globalThis.browser !== "undefined" && api === globalThis.browser;

  const queryTabs = (query) => {
    if (usesPromiseApi) {
      return api.tabs.query(query);
    }

    return new Promise((resolve) => {
      api.tabs.query(query, (tabs) => resolve(tabs || []));
    });
  };

  const updateTab = (tabId, url) => {
    if (usesPromiseApi) {
      return api.tabs.update(tabId, { url }).catch(() => undefined);
    }

    return new Promise((resolve) => {
      api.tabs.update(tabId, { url }, () => {
        void api.runtime.lastError;
        resolve();
      });
    });
  };

  const normalizeUrl = (url = "") => {
    const [withoutHash] = url.split("#", 1);
    const [withoutQuery] = withoutHash.split("?", 1);
    return withoutQuery;
  };

  const shouldRedirect = (tab) => {
    const tabUrl = tab?.url || tab?.pendingUrl || "";

    if (!tab || typeof tab.id !== "number" || !tabUrl) {
      return false;
    }

    return browserHomeUrls.has(normalizeUrl(tabUrl)) && tabUrl !== extensionPage;
  };

  const redirectTab = (tab) => {
    if (shouldRedirect(tab)) {
      void updateTab(tab.id, extensionPage);
    }
  };

  const redirectOpenHomeTabs = async () => {
    try {
      const tabs = await queryTabs({});
      tabs.forEach(redirectTab);
    } catch {
      // Browser-owned pages can be hidden from extension APIs during startup.
    }
  };

  api.runtime.onStartup?.addListener(() => {
    void redirectOpenHomeTabs();
    setTimeout(() => void redirectOpenHomeTabs(), 750);
  });

  api.runtime.onInstalled?.addListener(() => {
    void redirectOpenHomeTabs();
  });

  api.tabs.onCreated?.addListener(redirectTab);
  api.tabs.onUpdated?.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || tab?.pendingUrl) {
      redirectTab({ ...tab, id: tabId, url: changeInfo.url || tab?.url, pendingUrl: tab?.pendingUrl });
    }
  });

  void redirectOpenHomeTabs();
})();
