(function () {
  "use strict";

  const STORAGE_KEY = "albumNewTabState";
  const DEFAULT_AUTO_PLAY_INTERVAL_SECONDS = 7;
  const MIN_AUTO_PLAY_INTERVAL_SECONDS = 5;
  const DEFAULT_IMAGE_TRANSITION_DURATION_MS = 1600;
  const MIN_IMAGE_TRANSITION_DURATION_MS = 200;
  const MAX_IMAGE_TRANSITION_DURATION_MS = 3000;
  const DEFAULT_ALBUMS = globalThis.DEFAULT_ALBUMS;
  if (!Array.isArray(DEFAULT_ALBUMS) || DEFAULT_ALBUMS.length === 0) {
    throw new Error("Default albums failed to load.");
  }

  const DEFAULT_ALBUM = DEFAULT_ALBUMS[0];
  const REMOVED_DEFAULT_IMAGE_IDS_BY_ALBUM = {
    dogs: new Set([
      "dogs-golden-retriever-surf",
      "dogs-husky-snow-forest",
      "dogs-corgi-wildflower-meadow",
      "dogs-black-lab-mountain-lake",
      "dogs-samoyed-window-rug",
      "dogs-border-collie-field",
      "dogs-dachshund-raincoat-city",
      "dogs-german-shepherd-overlook",
      "dogs-beagle-autumn-park",
      "dogs-rescue-dogs-porch"
    ]),
    planet: new Set([
      "planet-earth-blue-marble",
      "planet-saturn-during-equinox",
      "planet-neptune-voyager2-color-calibrated",
      "planet-earthrise-apollo-8",
      "planet-solar-system-montage",
      "planet-saturn-eclipse-cassini",
      "planet-jupiter-opal-2024",
      "planet-mars-august-2021"
    ])
  };
  const browserApi = globalThis.browser || globalThis.chrome;
  const elements = {
    stage: document.querySelector(".stage"),
    websiteBackground: document.getElementById("website-background"),
    backgroundImages: Array.from(document.querySelectorAll(".background-image")),
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
    autoPlayInput: document.getElementById("auto-play-input"),
    autoPlayIntervalField: document.getElementById("auto-play-interval-field"),
    autoPlayIntervalInput: document.getElementById("auto-play-interval-input"),
    websiteBackgroundUrlField: document.getElementById("website-background-url-field"),
    websiteBackgroundUrlInput: document.getElementById("website-background-url-input"),
    imageTransitionDurationInput: document.getElementById("image-transition-duration-input"),
    imageTransitionDurationValue: document.getElementById("image-transition-duration-value"),
    albumAdminList: document.getElementById("album-admin-list"),
    albumEditorPanel: document.getElementById("album-editor-panel"),
    closeEditorButton: document.getElementById("close-editor-button"),
    albumNameInput: document.getElementById("album-name-input"),
    imageUrlInput: document.getElementById("image-url-input"),
    addUrlButton: document.getElementById("add-url-button"),
    imageFileInput: document.getElementById("image-file-input"),
    imageList: document.getElementById("image-list")
  };

  let state = null;
  let activeImage = null;
  let editingAlbumId = null;
  let autoPlayTimerId = null;
  let visibleBackgroundIndex = 0;
  let imageLoadToken = 0;
  let albumDragState = null;

  init();

  async function init() {
    state = normalizeState(await loadState());
    await saveState();
    bindEvents();
    applyImageTransitionDuration();
    render();
    syncWebsiteBackground();
    if (!isWebsiteBackgroundActive()) {
      showRandomImage();
    }
    syncAutoPlayTimer();
  }

  function bindEvents() {
    elements.albumMenuButton.addEventListener("click", toggleAlbumMenu);
    elements.newAlbumButton.addEventListener("click", createAlbumFromMenu);
    elements.shuffleButton.addEventListener("click", showRandomImage);
    elements.settingsButton.addEventListener("click", openSettings);
    elements.closeSettingsButton.addEventListener("click", closeSettings);
    elements.autoPlayInput.addEventListener("change", handleAutoPlayInput);
    elements.autoPlayIntervalInput.addEventListener("change", handleAutoPlayIntervalInput);
    elements.websiteBackgroundUrlInput.addEventListener("input", handleWebsiteBackgroundUrlInput);
    elements.websiteBackgroundUrlInput.addEventListener("change", handleWebsiteBackgroundUrlInput);
    elements.websiteBackgroundUrlInput.addEventListener("keydown", handleWebsiteBackgroundUrlKeydown);
    elements.imageTransitionDurationInput.addEventListener("input", handleImageTransitionDurationInput);
    elements.closeEditorButton.addEventListener("click", closeAlbumEditor);
    elements.albumNameInput.addEventListener("input", handleAlbumNameInput);
    elements.addUrlButton.addEventListener("click", addUrlsToEditingAlbum);
    elements.imageFileInput.addEventListener("change", addFilesToEditingAlbum);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAlbumMenu();
        closeSettings();
        closeAlbumEditor();
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
            settings: getDefaultSettings(),
            albums: []
          };

    nextState.lastImageByAlbum = nextState.lastImageByAlbum || {};
    nextState.settings = normalizeSettings(nextState.settings);
    nextState.albums = nextState.albums.filter(isValidAlbum).map((album) => ({
      ...album,
      images: album.images.filter(isValidImage)
    }));

    DEFAULT_ALBUMS.forEach((albumTemplate) => {
      const defaultAlbum = nextState.albums.find((album) => album.id === albumTemplate.id);
      if (!defaultAlbum) {
        nextState.albums.push(structuredCloneAlbum(albumTemplate));
        return;
      }

      const removedImageIds = REMOVED_DEFAULT_IMAGE_IDS_BY_ALBUM[albumTemplate.id];
      if (removedImageIds) {
        defaultAlbum.images = defaultAlbum.images.filter((image) => !removedImageIds.has(image.id));
      }

      const knownImageIds = new Set(defaultAlbum.images.map((image) => image.id));
      albumTemplate.images.forEach((image) => {
        if (!knownImageIds.has(image.id)) {
          defaultAlbum.images.push({ ...image });
        }
      });

      const currentImageIds = new Set(defaultAlbum.images.map((image) => image.id));
      if (!currentImageIds.has(nextState.lastImageByAlbum[albumTemplate.id])) {
        delete nextState.lastImageByAlbum[albumTemplate.id];
      }
    });

    if (!nextState.albums.some((album) => album.id === nextState.selectedAlbumId)) {
      nextState.selectedAlbumId = nextState.albums[0].id;
    }

    return nextState;
  }

  function getDefaultSettings() {
    return {
      autoPlay: false,
      autoPlayIntervalSeconds: DEFAULT_AUTO_PLAY_INTERVAL_SECONDS,
      websiteBackgroundUrl: "",
      imageTransitionDurationMs: DEFAULT_IMAGE_TRANSITION_DURATION_MS
    };
  }

  function normalizeSettings(settings) {
    const defaults = getDefaultSettings();
    const interval = Number(settings && settings.autoPlayIntervalSeconds);
    const transitionDuration = Number(settings && settings.imageTransitionDurationMs);

    return {
      autoPlay: Boolean(settings && settings.autoPlay),
      autoPlayIntervalSeconds:
        Number.isFinite(interval) && interval >= MIN_AUTO_PLAY_INTERVAL_SECONDS
          ? Math.round(interval)
          : defaults.autoPlayIntervalSeconds,
      websiteBackgroundUrl: normalizeWebsiteUrl(settings && settings.websiteBackgroundUrl),
      imageTransitionDurationMs:
        Number.isFinite(transitionDuration)
          ? clamp(Math.round(transitionDuration), MIN_IMAGE_TRANSITION_DURATION_MS, MAX_IMAGE_TRANSITION_DURATION_MS)
          : defaults.imageTransitionDurationMs
    };
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
    if (isWebsiteBackgroundActive()) {
      renderHeader();
      return;
    }

    const album = getSelectedAlbum();
    if (!album || album.images.length === 0) {
      resetBackgroundImages();
      activeImage = null;
      renderHeader();
      return;
    }

    const nextImage = pickImage(album);
    activeImage = nextImage;
    state.lastImageByAlbum[album.id] = nextImage.id;
    saveState();

    transitionToImage(nextImage, album.name.trim() || "Untitled album");
    renderHeader();
  }

  function transitionToImage(image, altText) {
    const token = ++imageLoadToken;
    const currentLayer = getVisibleBackground();
    const nextIndex = (visibleBackgroundIndex + 1) % elements.backgroundImages.length;
    const nextLayer = elements.backgroundImages[nextIndex];

    nextLayer.onload = () => revealBackgroundImage(token, currentLayer, nextLayer, nextIndex, altText);
    nextLayer.onerror = () => {
      if (token === imageLoadToken) {
        nextLayer.removeAttribute("src");
      }
    };
    nextLayer.classList.remove("is-visible", "is-entering", "is-exiting");
    nextLayer.alt = "";
    nextLayer.setAttribute("aria-hidden", "true");
    nextLayer.src = image.src;

    if (nextLayer.complete && nextLayer.naturalWidth > 0) {
      requestAnimationFrame(() => revealBackgroundImage(token, currentLayer, nextLayer, nextIndex, altText));
    }
  }

  function revealBackgroundImage(token, currentLayer, nextLayer, nextIndex, altText) {
    if (token !== imageLoadToken) {
      return;
    }

    nextLayer.onload = null;
    nextLayer.onerror = null;

    currentLayer.classList.remove("is-visible", "is-entering");
    currentLayer.classList.add("is-exiting");
    currentLayer.alt = "";
    currentLayer.setAttribute("aria-hidden", "true");

    nextLayer.classList.remove("is-exiting");
    nextLayer.classList.add("is-visible", "is-entering");
    nextLayer.alt = altText;
    nextLayer.removeAttribute("aria-hidden");
    visibleBackgroundIndex = nextIndex;

    window.setTimeout(() => {
      if (token !== imageLoadToken) {
        return;
      }

      currentLayer.classList.remove("is-exiting");
      nextLayer.classList.remove("is-entering");
    }, state.settings.imageTransitionDurationMs);
  }

  function resetBackgroundImages() {
    imageLoadToken += 1;
    elements.backgroundImages.forEach((image) => {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.classList.remove("is-visible", "is-entering", "is-exiting");
    });
  }

  function getVisibleBackground() {
    return elements.backgroundImages[visibleBackgroundIndex];
  }

  function syncAutoPlayTimer() {
    if (autoPlayTimerId !== null) {
      clearInterval(autoPlayTimerId);
      autoPlayTimerId = null;
    }

    if (!state.settings.autoPlay || isWebsiteBackgroundActive()) {
      return;
    }

    autoPlayTimerId = setInterval(showRandomImage, state.settings.autoPlayIntervalSeconds * 1000);
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

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function render() {
    renderHeader();
    renderAlbumMenu();
    renderSettings();
    renderAlbumEditor();
  }

  function renderHeader() {
    const album = getSelectedAlbum();
    const websiteActive = isWebsiteBackgroundActive();
    elements.albumName.textContent = album ? album.name.trim() || "Untitled album" : "No album";
    elements.imageCount.textContent = album ? String(album.images.length) : "0";
    elements.albumMenuButton.disabled = websiteActive;
    elements.albumMenuButton.title = websiteActive ? "Clear the website URL to use albums" : "";
    elements.shuffleButton.disabled = websiteActive;
    elements.shuffleButton.title = websiteActive ? "Clear the website URL to shuffle images" : "Shuffle";
  }

  function renderAlbumMenu() {
    const websiteActive = isWebsiteBackgroundActive();
    const canSortAlbums = !websiteActive && state.albums.length > 1;
    elements.albumMenuList.replaceChildren();
    elements.newAlbumButton.disabled = websiteActive;
    state.albums.forEach((album) => {
      const item = document.createElement("div");
      item.className = "album-item";
      item.setAttribute("role", "listitem");
      item.dataset.albumId = album.id;

      const dragHandle = document.createElement("span");
      dragHandle.className = "album-drag-handle";
      dragHandle.title = canSortAlbums ? "Drag to sort albums" : "";
      dragHandle.dataset.sortable = String(canSortAlbums);
      dragHandle.draggable = false;
      dragHandle.setAttribute("aria-hidden", "true");
      dragHandle.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5h.01"></path><path d="M15 5h.01"></path><path d="M9 12h.01"></path><path d="M15 12h.01"></path><path d="M9 19h.01"></path><path d="M15 19h.01"></path></svg>';
      dragHandle.addEventListener("pointerdown", (event) => handleAlbumPointerDown(event, album.id, item));
      dragHandle.addEventListener("pointercancel", clearAlbumDragState);

      const selectButton = document.createElement("button");
      selectButton.className = "album-select";
      selectButton.type = "button";
      selectButton.disabled = websiteActive;
      selectButton.setAttribute("role", "menuitem");
      selectButton.classList.toggle("is-selected", album.id === state.selectedAlbumId);
      selectButton.addEventListener("click", async () => {
        state.selectedAlbumId = album.id;
        await saveState();
        closeAlbumMenu();
        render();
        if (!isWebsiteBackgroundActive()) {
          showRandomImage();
        }
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

      const editButton = document.createElement("button");
      editButton.className = "icon-button album-edit";
      editButton.type = "button";
      editButton.disabled = websiteActive;
      editButton.title = "Edit album";
      editButton.setAttribute("aria-label", `Edit album: ${album.name}`);
      editButton.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
      editButton.addEventListener("click", () => openAlbumEditor(album.id));

      item.append(dragHandle, selectButton, editButton);
      elements.albumMenuList.append(item);
    });
  }

  function handleAlbumPointerDown(event, albumId, item) {
    const isPrimaryMouseButton = event.pointerType !== "mouse" || event.button === 0;
    if (isWebsiteBackgroundActive() || state.albums.length <= 1 || !isPrimaryMouseButton) {
      return;
    }

    event.preventDefault();
    albumDragState = {
      albumId,
      captureElement: event.currentTarget,
      dropAfter: false,
      dropTargetId: null,
      pointerId: event.pointerId
    };
    elements.albumMenuList.classList.add("is-sorting");
    item.classList.add("is-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
    document.addEventListener("pointermove", handleAlbumPointerMove);
    document.addEventListener("pointerup", handleAlbumPointerUp);
    document.addEventListener("mousemove", handleAlbumPointerMove);
    document.addEventListener("mouseup", handleAlbumPointerUp);
  }

  function handleAlbumPointerMove(event) {
    if (!isAlbumDragEvent(event)) {
      return;
    }

    event.preventDefault();
    updateAlbumDragTarget(event);
  }

  async function handleAlbumPointerUp(event) {
    if (!isAlbumDragEvent(event)) {
      return;
    }

    event.preventDefault();
    updateAlbumDragTarget(event);
    const dragState = albumDragState;
    const captureElement = dragState.captureElement;
    if (
      typeof event.pointerId === "number" &&
      captureElement &&
      captureElement.hasPointerCapture(event.pointerId)
    ) {
      captureElement.releasePointerCapture(event.pointerId);
    }
    clearAlbumDragState();

    if (dragState.dropTargetId) {
      await moveAlbum(dragState.albumId, dragState.dropTargetId, dragState.dropAfter);
    }
  }

  function isAlbumDragEvent(event) {
    return (
      albumDragState &&
      (typeof event.pointerId !== "number" || event.pointerId === albumDragState.pointerId)
    );
  }

  function updateAlbumDragTarget(event) {
    if (!albumDragState) {
      return;
    }

    clearAlbumDropIndicators();
    const targetItem = document.elementFromPoint(event.clientX, event.clientY)?.closest(".album-item");
    if (!targetItem || !elements.albumMenuList.contains(targetItem)) {
      albumDragState.dropTargetId = null;
      return;
    }

    const targetAlbumId = targetItem.dataset.albumId;
    if (!targetAlbumId || targetAlbumId === albumDragState.albumId) {
      albumDragState.dropTargetId = null;
      return;
    }

    const rect = targetItem.getBoundingClientRect();
    const dropAfter = event.clientY > rect.top + rect.height / 2;
    albumDragState.dropTargetId = targetAlbumId;
    albumDragState.dropAfter = dropAfter;
    targetItem.classList.toggle("is-drop-before", !dropAfter);
    targetItem.classList.toggle("is-drop-after", dropAfter);
  }

  async function moveAlbum(albumId, targetAlbumId, dropAfter) {
    const fromIndex = state.albums.findIndex((album) => album.id === albumId);
    const targetIndex = state.albums.findIndex((album) => album.id === targetAlbumId);
    if (fromIndex === -1 || targetIndex === -1) {
      return;
    }

    let insertIndex = targetIndex + (dropAfter ? 1 : 0);
    const [movedAlbum] = state.albums.splice(fromIndex, 1);

    if (fromIndex < insertIndex) {
      insertIndex -= 1;
    }

    state.albums.splice(insertIndex, 0, movedAlbum);
    await saveState();
    render();
  }

  function clearAlbumDragState() {
    albumDragState = null;
    document.removeEventListener("pointermove", handleAlbumPointerMove);
    document.removeEventListener("pointerup", handleAlbumPointerUp);
    document.removeEventListener("mousemove", handleAlbumPointerMove);
    document.removeEventListener("mouseup", handleAlbumPointerUp);
    elements.albumMenuList.classList.remove("is-sorting");
    clearAlbumDropIndicators();
    elements.albumMenuList
      .querySelectorAll(".is-dragging")
      .forEach((item) => item.classList.remove("is-dragging"));
  }

  function clearAlbumDropIndicators() {
    elements.albumMenuList
      .querySelectorAll(".is-drop-before, .is-drop-after")
      .forEach((item) => item.classList.remove("is-drop-before", "is-drop-after"));
  }

  function renderSettings() {
    if (!elements.albumAdminList) {
      return;
    }

    const websiteActive = isWebsiteBackgroundActive();
    syncWebsiteUrlValidity(elements.websiteBackgroundUrlInput.value || state.settings.websiteBackgroundUrl);
    if (document.activeElement !== elements.websiteBackgroundUrlInput) {
      elements.websiteBackgroundUrlInput.value = state.settings.websiteBackgroundUrl;
    }
    elements.autoPlayInput.checked = state.settings.autoPlay;
    elements.autoPlayInput.disabled = websiteActive;
    elements.autoPlayIntervalInput.value = String(state.settings.autoPlayIntervalSeconds);
    elements.autoPlayIntervalInput.disabled = websiteActive || !state.settings.autoPlay;
    elements.autoPlayIntervalField.hidden = !state.settings.autoPlay;
    elements.imageTransitionDurationInput.value = String(state.settings.imageTransitionDurationMs);
    elements.imageTransitionDurationInput.disabled = websiteActive;
    elements.imageTransitionDurationValue.textContent = `${state.settings.imageTransitionDurationMs}ms`;
    elements.albumAdminList.classList.toggle("is-disabled", websiteActive);

    elements.albumAdminList.replaceChildren();
    const canDelete = state.albums.length > 1;

    state.albums.forEach((album) => {
      const item = document.createElement("div");
      item.className = "album-admin-item";
      item.setAttribute("role", "listitem");

      const info = document.createElement("div");
      info.className = "album-admin-info";
      const name = document.createElement("strong");
      name.textContent = album.name.trim() || "Untitled album";
      const meta = document.createElement("span");
      const imageText = `${album.images.length} image${album.images.length === 1 ? "" : "s"}`;
      meta.textContent = album.id === state.selectedAlbumId ? `${imageText} · active` : imageText;
      info.append(name, meta);

      const deleteButton = document.createElement("button");
      deleteButton.className = "icon-button album-admin-delete";
      deleteButton.type = "button";
      deleteButton.disabled = websiteActive || !canDelete;
      deleteButton.title = websiteActive
        ? "Clear the website URL to edit albums"
        : canDelete
          ? "Delete album"
          : "You must keep at least one album";
      deleteButton.setAttribute("aria-label", `Delete album: ${name.textContent}`);
      deleteButton.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>';
      deleteButton.addEventListener("click", () => deleteAlbum(album.id));

      item.append(info, deleteButton);
      elements.albumAdminList.append(item);
    });
  }

  async function handleAutoPlayInput(event) {
    state.settings.autoPlay = event.target.checked;
    elements.autoPlayIntervalInput.disabled = !state.settings.autoPlay;
    elements.autoPlayIntervalField.hidden = !state.settings.autoPlay;
    await saveState();
    syncAutoPlayTimer();
  }

  async function handleAutoPlayIntervalInput(event) {
    const interval = Number(event.target.value);
    state.settings.autoPlayIntervalSeconds =
      Number.isFinite(interval) && interval >= MIN_AUTO_PLAY_INTERVAL_SECONDS
        ? Math.round(interval)
        : DEFAULT_AUTO_PLAY_INTERVAL_SECONDS;
    event.target.value = String(state.settings.autoPlayIntervalSeconds);
    await saveState();
    syncAutoPlayTimer();
  }

  async function handleWebsiteBackgroundUrlInput(event) {
    const wasWebsiteActive = isWebsiteBackgroundActive();
    const normalizedUrl = syncWebsiteUrlValidity(event.target.value);
    state.settings.websiteBackgroundUrl = normalizedUrl;
    if (event.type === "change" || event.key === "Enter") {
      event.target.value = normalizedUrl || event.target.value.trim();
    }
    await saveState();
    syncWebsiteBackground();
    syncAutoPlayTimer();
    render();
    if (wasWebsiteActive && !isWebsiteBackgroundActive()) {
      showRandomImage();
    }
  }

  function handleWebsiteBackgroundUrlKeydown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleWebsiteBackgroundUrlInput(event);
    event.target.blur();
  }

  async function handleImageTransitionDurationInput(event) {
    const duration = Number(event.target.value);
    state.settings.imageTransitionDurationMs =
      Number.isFinite(duration)
        ? clamp(Math.round(duration), MIN_IMAGE_TRANSITION_DURATION_MS, MAX_IMAGE_TRANSITION_DURATION_MS)
        : DEFAULT_IMAGE_TRANSITION_DURATION_MS;
    event.target.value = String(state.settings.imageTransitionDurationMs);
    elements.imageTransitionDurationValue.textContent = `${state.settings.imageTransitionDurationMs}ms`;
    applyImageTransitionDuration();
    await saveState();
  }

  function applyImageTransitionDuration() {
    document.documentElement.style.setProperty(
      "--image-transition-duration",
      `${state.settings.imageTransitionDurationMs}ms`
    );
  }

  function syncWebsiteBackground() {
    const url = isWebsiteBackgroundActive() ? state.settings.websiteBackgroundUrl : "";
    elements.stage.classList.toggle("has-website-background", Boolean(url));

    if (url) {
      closeAlbumMenu();
      closeAlbumEditor();
      if (elements.websiteBackground.src !== url) {
        elements.websiteBackground.src = url;
      }
      return;
    }

    elements.websiteBackground.removeAttribute("src");
  }

  function isWebsiteBackgroundActive() {
    return Boolean(normalizeWebsiteUrl(state.settings.websiteBackgroundUrl));
  }

  function normalizeWebsiteUrl(value) {
    const rawValue = typeof value === "string" ? value.trim() : "";
    if (!rawValue) {
      return "";
    }

    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;

    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "";
      }

      if (!hasWebsiteLikeHost(url.hostname)) {
        return "";
      }

      return url.href;
    } catch (error) {
      return "";
    }
  }

  function hasWebsiteLikeHost(hostname) {
    return (
      hostname === "localhost" ||
      hostname.includes(".") ||
      hostname.includes(":")
    );
  }

  function syncWebsiteUrlValidity(value) {
    const rawValue = typeof value === "string" ? value.trim() : "";
    const normalizedUrl = normalizeWebsiteUrl(rawValue);
    const isValid = !rawValue || Boolean(normalizedUrl);

    elements.websiteBackgroundUrlInput.setCustomValidity(isValid ? "" : "Enter a valid http or https URL.");
    elements.websiteBackgroundUrlField.classList.toggle("is-invalid", Boolean(rawValue && !normalizedUrl));
    elements.websiteBackgroundUrlField.classList.toggle("is-valid", Boolean(normalizedUrl));

    return normalizedUrl;
  }

  function getEditingAlbum() {
    return state.albums.find((album) => album.id === editingAlbumId) || null;
  }

  function renderAlbumEditor() {
    const album = getEditingAlbum();
    elements.imageList.replaceChildren();

    if (!album) {
      return;
    }

    if (document.activeElement !== elements.albumNameInput) {
      elements.albumNameInput.value = album.name;
    }

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
    const album = {
      id: `album-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: "New album",
      images: []
    };
    state.albums.push(album);
    state.selectedAlbumId = album.id;
    await saveState();
    render();
    if (!isWebsiteBackgroundActive()) {
      showRandomImage();
    }
    openAlbumEditor(album.id);
  }

  async function deleteAlbum(albumId) {
    if (state.albums.length <= 1) {
      return;
    }

    const album = state.albums.find((item) => item.id === albumId);
    if (!album) {
      return;
    }

    const displayName = album.name.trim() || "Untitled album";
    if (!window.confirm(`Delete album "${displayName}"? This can't be undone.`)) {
      return;
    }

    const wasSelected = state.selectedAlbumId === albumId;
    state.albums = state.albums.filter((item) => item.id !== albumId);
    delete state.lastImageByAlbum[albumId];

    if (editingAlbumId === albumId) {
      editingAlbumId = null;
      elements.albumEditorPanel.classList.remove("is-open");
      elements.albumEditorPanel.style.left = "-420px";
      elements.albumEditorPanel.setAttribute("aria-hidden", "true");
    }

    if (wasSelected) {
      state.selectedAlbumId = state.albums[0].id;
    }

    await saveState();
    render();
    if (wasSelected && !isWebsiteBackgroundActive()) {
      showRandomImage();
    }
  }

  async function addUrlsToEditingAlbum() {
    const album = getEditingAlbum();
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
    if (album.id === state.selectedAlbumId && !activeImage && !isWebsiteBackgroundActive()) {
      showRandomImage();
    }
  }

  async function addFilesToEditingAlbum(event) {
    const album = getEditingAlbum();
    if (!album) {
      event.target.value = "";
      return;
    }

    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    const images = await Promise.all(files.map(readImageFile));
    album.images.push(...images);
    elements.imageFileInput.value = "";
    await saveState();
    render();
    if (album.id === state.selectedAlbumId && !activeImage && !isWebsiteBackgroundActive()) {
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
    if (activeImage && activeImage.id === imageId && !isWebsiteBackgroundActive()) {
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
    closeAlbumEditor();
    renderSettings();
    elements.settingsPanel.classList.add("is-open");
    elements.settingsPanel.style.right = "0";
    elements.settingsPanel.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    elements.settingsPanel.classList.remove("is-open");
    elements.settingsPanel.style.right = "-420px";
    elements.settingsPanel.setAttribute("aria-hidden", "true");
  }

  function openAlbumEditor(albumId) {
    if (isWebsiteBackgroundActive()) {
      return;
    }

    const album = state.albums.find((item) => item.id === albumId);
    if (!album) {
      return;
    }

    editingAlbumId = albumId;
    closeAlbumMenu();
    closeSettings();
    renderAlbumEditor();
    elements.albumEditorPanel.classList.add("is-open");
    elements.albumEditorPanel.style.left = "0";
    elements.albumEditorPanel.setAttribute("aria-hidden", "false");
    elements.albumNameInput.focus();
    elements.albumNameInput.select();
  }

  function closeAlbumEditor() {
    const album = getEditingAlbum();
    if (album && !album.name.trim()) {
      album.name = "Untitled album";
      saveState();
    }

    const wasEditing = editingAlbumId !== null;
    editingAlbumId = null;
    elements.albumEditorPanel.classList.remove("is-open");
    elements.albumEditorPanel.style.left = "-420px";
    elements.albumEditorPanel.setAttribute("aria-hidden", "true");

    if (wasEditing) {
      render();
    }
  }

  async function handleAlbumNameInput(event) {
    const album = getEditingAlbum();
    if (!album) {
      return;
    }

    album.name = event.target.value;
    if (album.id === state.selectedAlbumId) {
      getVisibleBackground().alt = album.name.trim() || "Untitled album";
      renderHeader();
    }
    await saveState();
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
