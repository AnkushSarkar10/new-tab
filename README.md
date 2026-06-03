# new tab

firefox new-tab replacement that shows a random fullscreen image from the selected album.

## load in Firefox

1. open `about:debugging#/runtime/this-firefox`.
2. click `Load Temporary Add-on...`.
3. select `manifest.json` from this folder.

the default album is `kanye`. Use the settings button on the new tab page to add albums, add image URLs, add local files, or switch the selected album.

## package

create a zip from the extension files:

```powershell
Compress-Archive -Path manifest.json,newtab.html,scripts,styles,assets -DestinationPath album-new-tab.zip -Force
```
