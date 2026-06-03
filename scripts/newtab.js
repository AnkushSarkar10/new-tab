(function () {
  "use strict";

  const STORAGE_KEY = "albumNewTabState";
  const DEFAULT_ALBUM = {
    id: "kanye",
    name: "kanye",
    images: [
      {
        id: "kanye-wp5735473",
        src: "assets/kanye/wp5735473.jpg",
        label: "wp5735473.jpg"
      },
      {
        id: "kanye-wp5717645",
        src: "assets/kanye/wp5717645.png",
        label: "wp5717645.png"
      },
      {
        id: "kanye-wp5735568",
        src: "assets/kanye/wp5735568.jpg",
        label: "wp5735568.jpg"
      },
      {
        id: "kanye-wp5735587",
        src: "assets/kanye/wp5735587.jpg",
        label: "wp5735587.jpg"
      },
      {
        id: "kanye-wp5735609",
        src: "assets/kanye/wp5735609.jpg",
        label: "wp5735609.jpg"
      },
      {
        id: "kanye-wp5735772",
        src: "assets/kanye/wp5735772.jpg",
        label: "wp5735772.jpg"
      },
      {
        id: "kanye-wp9673902",
        src: "assets/kanye/wp9673902.jpg",
        label: "wp9673902.jpg"
      },
      {
        id: "kanye-wp14338884",
        src: "assets/kanye/wp14338884.jpg",
        label: "wp14338884.jpg"
      },
      {
        id: "kanye-wp11340994",
        src: "assets/kanye/wp11340994.jpg",
        label: "wp11340994.jpg"
      }
    ]
  };
  const browserApi = globalThis.browser || globalThis.chrome;
  const elements = {
    background: document.getElementById("background-image"),
    albumMenuButton: document.getElementById("album-menu-button"),
    albumMenu: document.getElementById("album-menu"),
    albumMenuList: document.getElementById("album-menu-list"),
    albumName: document.getElementById("album-name"),
    imageCount: document.getElementById("image-count"),
    newAlbumButton: document.getElementById("new-album-button"),
    shuffleButton: document.getElementById("shuffle-button"),
    settingsButton: document.getElementById("settings-button"),
    closeSettingsButton: document.getElementById("close-settings-button"),
    settingsPanel: document.getElementById("settings-panel"),
    editorTitle: document.getElementById("editor-title"),
    deleteAlbumButton: document.getElementById("delete-album-button"),
    imageUrlInput: document.getElementById("image-url-input"),
    addUrlButton: document.getElementById("add-url-button"),
    imageFileInput: document.getElementById("image-file-input"),
    imageList: document.getElementById("image-list")
  };

  let state = null;
  let activeImage = null;

  init();

  async function init() {
    state = normalizeState(await loadState());
    await saveState();
    bindEvents();
    render();
    showRandomImage();
  }

  function bindEvents() {
    elements.albumMenuButton.addEventListener("click", toggleAlbumMenu);
    elements.newAlbumButton.addEventListener("click", createAlbumFromMenu);
    elements.shuffleButton.addEventListener("click", showRandomImage);
    elements.settingsButton.addEventListener("click", openSettings);
    elements.closeSettingsButton.addEventListener("click", closeSettings);
    elements.deleteAlbumButton.addEventListener("click", deleteSelectedAlbum);
    elements.addUrlButton.addEventListener("click", addUrlsToSelectedAlbum);
    elements.imageFileInput.addEventListener("change", addFilesToSelectedAlbum);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAlbumMenu();
        closeSettings();
      }
      if (event.key.toLowerCase() === "r" && !isTextInput(event.target)) {
        showRandomImage();
      }
    });

    document.addEventListener("click", (event) => {
      if (!elements.albumMenu.contains(event.target) && !elements.albumMenuButton.contains(event.target)) {
        closeAlbumMenu();
      }
    });
  }

  async function loadState() {
    if (!browserApi || !browserApi.storage || !browserApi.storage.local) {
      return readLocalStorageFallback();
    }

    if (browserApi.storage.local.get.length === 1) {
      const result = await browserApi.storage.local.get(STORAGE_KEY);
      return result[STORAGE_KEY];
    }

    return new Promise((resolve) => {
      browserApi.storage.local.get(STORAGE_KEY, (result) => resolve(result[STORAGE_KEY]));
    });
  }

  async function saveState() {
    if (!browserApi || !browserApi.storage || !browserApi.storage.local) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    }

    const payload = { [STORAGE_KEY]: state };
    if (browserApi.storage.local.set.length === 1) {
      await browserApi.storage.local.set(payload);
      return;
    }

    await new Promise((resolve) => browserApi.storage.local.set(payload, resolve));
  }

  function readLocalStorageFallback() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function normalizeState(rawState) {
    const nextState =
      rawState && Array.isArray(rawState.albums)
        ? rawState
        : {
            selectedAlbumId: DEFAULT_ALBUM.id,
            lastImageByAlbum: {},
            albums: []
          };

    nextState.lastImageByAlbum = nextState.lastImageByAlbum || {};
    nextState.albums = nextState.albums.filter(isValidAlbum).map((album) => ({
      ...album,
      images: album.images.filter(isValidImage)
    }));

    const defaultAlbum = nextState.albums.find((album) => album.id === DEFAULT_ALBUM.id);
    if (!defaultAlbum) {
      nextState.albums.unshift(structuredCloneAlbum(DEFAULT_ALBUM));
    } else {
      const knownImageIds = new Set(defaultAlbum.images.map((image) => image.id));
      DEFAULT_ALBUM.images.forEach((image) => {
        if (!knownImageIds.has(image.id)) {
          defaultAlbum.images.push({ ...image });
        }
      });
    }

    if (!nextState.albums.some((album) => album.id === nextState.selectedAlbumId)) {
      nextState.selectedAlbumId = nextState.albums[0].id;
    }

    return nextState;
  }

  function isValidAlbum(album) {
    return album && typeof album.id === "string" && typeof album.name === "string" && Array.isArray(album.images);
  }

  function isValidImage(image) {
    return image && typeof image.id === "string" && typeof image.src === "string";
  }

  function structuredCloneAlbum(album) {
    return {
      id: album.id,
      name: album.name,
      images: album.images.map((image) => ({ ...image }))
    };
  }

  function getSelectedAlbum() {
    return state.albums.find((album) => album.id === state.selectedAlbumId) || state.albums[0];
  }

  function showRandomImage() {
    const album = getSelectedAlbum();
    if (!album || album.images.length === 0) {
      elements.background.removeAttribute("src");
      elements.background.classList.remove("is-loaded");
      activeImage = null;
      renderHeader();
      return;
    }

    const nextImage = pickImage(album);
    activeImage = nextImage;
    state.lastImageByAlbum[album.id] = nextImage.id;
    saveState();

    elements.background.classList.remove("is-loaded");
    elements.background.onload = () => elements.background.classList.add("is-loaded");
    elements.background.src = nextImage.src;
    elements.background.alt = album.name;
    renderHeader();
  }

  function pickImage(album) {
    const previousId = state.lastImageByAlbum[album.id];
    const candidates = album.images.length > 1 ? album.images.filter((image) => image.id !== previousId) : album.images;
    const randomIndex = Math.floor(cryptoRandom() * candidates.length);
    return candidates[randomIndex];
  }

  function cryptoRandom() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }

  function render() {
    renderHeader();
    renderAlbumMenu();
    renderEditor();
  }

  function renderHeader() {
    const album = getSelectedAlbum();
    elements.albumName.textContent = album ? album.name : "No album";
    elements.imageCount.textContent = album ? String(album.images.length) : "0";
  }

  function renderAlbumMenu() {
    elements.albumMenuList.replaceChildren();
    state.albums.forEach((album) => {
      const item = document.createElement("div");
      item.className = "album-item";
      item.setAttribute("role", "listitem");

      const selectButton = document.createElement("button");
      selectButton.className = "album-select";
      selectButton.type = "button";
      selectButton.setAttribute("role", "menuitem");
      selectButton.classList.toggle("is-selected", album.id === state.selectedAlbumId);
      selectButton.addEventListener("click", async () => {
        state.selectedAlbumId = album.id;
        await saveState();
        closeAlbumMenu();
        render();
        showRandomImage();
      });

      const titleRow = document.createElement("div");
      titleRow.className = "album-title-row";
      const title = document.createElement("strong");
      title.textContent = album.name;
      titleRow.append(title);
      if (album.id === state.selectedAlbumId) {
        const activeBadge = document.createElement("span");
        activeBadge.className = "album-active-badge";
        activeBadge.textContent = "(active)";
        titleRow.append(activeBadge);
      }
      const count = document.createElement("span");
      count.textContent = `${album.images.length} image${album.images.length === 1 ? "" : "s"}`;
      selectButton.append(titleRow, count);

      item.append(selectButton);
      elements.albumMenuList.append(item);
    });
  }

  function renderEditor() {
    const album = getSelectedAlbum();
    if (!album) {
      elements.editorTitle.textContent = "No album";
      elements.deleteAlbumButton.disabled = true;
      elements.imageList.replaceChildren();
      return;
    }

    elements.editorTitle.textContent = album.name;
    elements.deleteAlbumButton.disabled = state.albums.length <= 1;
    elements.imageList.replaceChildren();

    if (album.images.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No images";
      elements.imageList.append(empty);
      return;
    }

    album.images.forEach((image) => {
      const item = document.createElement("div");
      item.className = "image-item";
      item.setAttribute("role", "listitem");

      const thumb = document.createElement("img");
      thumb.className = "image-thumb";
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.src = image.src;

      const label = document.createElement("span");
      label.className = "image-label";
      label.textContent = image.label || image.src;

      const removeButton = document.createElement("button");
      removeButton.className = "icon-button";
      removeButton.type = "button";
      removeButton.title = "Remove";
      removeButton.setAttribute("aria-label", "Remove image");
      removeButton.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>';
      removeButton.addEventListener("click", () => removeImage(album.id, image.id));

      item.append(thumb, label, removeButton);
      elements.imageList.append(item);
    });
  }

  async function createAlbumFromMenu() {
    const name = window.prompt("Album name")?.trim();
    if (!name) {
      return;
    }

    const album = {
      id: `album-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      images: []
    };
    state.albums.push(album);
    state.selectedAlbumId = album.id;
    await saveState();
    closeAlbumMenu();
    render();
    showRandomImage();
  }

  async function deleteSelectedAlbum() {
    const album = getSelectedAlbum();
    if (!album || state.albums.length <= 1) {
      return;
    }

    state.albums = state.albums.filter((item) => item.id !== album.id);
    delete state.lastImageByAlbum[album.id];
    state.selectedAlbumId = state.albums[0].id;
    await saveState();
    render();
    showRandomImage();
  }

  async function addUrlsToSelectedAlbum() {
    const album = getSelectedAlbum();
    if (!album) {
      return;
    }

    const urls = elements.imageUrlInput.value
      .split(/\s+/)
      .map((url) => url.trim())
      .filter((url) => /^https?:\/\//i.test(url));

    urls.forEach((url) => {
      album.images.push({
        id: `url-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        src: url,
        label: filenameFromUrl(url)
      });
    });

    elements.imageUrlInput.value = "";
    await saveState();
    render();
    if (!activeImage) {
      showRandomImage();
    }
  }

  async function addFilesToSelectedAlbum(event) {
    const album = getSelectedAlbum();
    if (!album) {
      return;
    }

    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    const images = await Promise.all(files.map(readImageFile));
    album.images.push(...images);
    elements.imageFileInput.value = "";
    await saveState();
    render();
    if (!activeImage) {
      showRandomImage();
    }
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () =>
        resolve({
          id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          src: reader.result,
          label: file.name
        });
      reader.readAsDataURL(file);
    });
  }

  async function removeImage(albumId, imageId) {
    const album = state.albums.find((item) => item.id === albumId);
    if (!album) {
      return;
    }

    album.images = album.images.filter((image) => image.id !== imageId);
    if (state.lastImageByAlbum[album.id] === imageId) {
      delete state.lastImageByAlbum[album.id];
    }
    await saveState();
    render();
    if (activeImage && activeImage.id === imageId) {
      showRandomImage();
    }
  }

  function filenameFromUrl(url) {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split("/").filter(Boolean).pop() || url;
    } catch (error) {
      return url;
    }
  }

  function openSettings() {
    closeAlbumMenu();
    elements.settingsPanel.classList.add("is-open");
    elements.settingsPanel.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    elements.settingsPanel.classList.remove("is-open");
    elements.settingsPanel.setAttribute("aria-hidden", "true");
  }

  function toggleAlbumMenu() {
    if (elements.albumMenu.classList.contains("is-open")) {
      closeAlbumMenu();
      return;
    }

    openAlbumMenu();
  }

  function openAlbumMenu() {
    elements.albumMenu.classList.add("is-open");
    elements.albumMenu.setAttribute("aria-hidden", "false");
    elements.albumMenuButton.setAttribute("aria-expanded", "true");
  }

  function closeAlbumMenu() {
    elements.albumMenu.classList.remove("is-open");
    elements.albumMenu.setAttribute("aria-hidden", "true");
    elements.albumMenuButton.setAttribute("aria-expanded", "false");
  }

  function isTextInput(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  }
})();
