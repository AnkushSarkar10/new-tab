# new tab

firefox new-tab replacement that shows a random fullscreen image from the selected album.

the extension replaces the new tab page and uses a small background script to catch browser-owned home/startup tabs and send them to the same page. firefox also gets a manifest-level homepage override. chrome uses the redirect path so it does not show chrome's built-in new-tab override notice.

## load in firefox

1. open `about:debugging#/runtime/this-firefox`.
2. click `load temporary add-on...`.
3. select `manifest.json` from this folder.

the default album is `kanye`. use the settings button on the new tab page to add albums, add image urls, add local files, or switch the selected album.

after changing the manifest, reload the extension in `about:debugging#/runtime/this-firefox` and restart firefox to confirm the first window opens on the extension page.

## package

create a firefox zip from the extension files:

```powershell
compress-archive -path manifest.json,newtab.html,scripts,styles,assets -destinationpath album-new-tab.zip -force
```

## load in chrome

chrome requires a manifest v3 build. create the chrome upload package:

```powershell
.\scripts\package-chrome.ps1
```

then open `chrome://extensions`, enable developer mode, click `load unpacked`, and select `dist\chrome`.

upload `dist\album-new-tab-chrome.zip` in the chrome web store developer dashboard.

after changing the manifest or scripts, rebuild with the command above, reload the extension in `chrome://extensions`, and restart chrome to confirm the first window opens on the extension page.

## load in vivaldi

vivaldi can use the chrome manifest v3 build, but it does not let extensions control the new tab page until you enable it in settings.

1. create the chrome build:

```powershell
.\scripts\package-chrome.ps1
```

2. open `vivaldi://extensions`, enable developer mode, click `load unpacked`, and select `dist\chrome`.
3. open `vivaldi://settings/tabs/`.
4. under `new tab page`, keep `start page` selected and check `controlled by extension`.
5. open a new tab.
