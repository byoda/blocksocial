# Bring Your Own Moderation (BYOMod)
A browser plug in that gives you control over moderating the content you see on social media sites

# Building the extension

## Prerequisites
Linux host
node.js: v22.5.1
npm: 10.8.2


## Build for Firefox
cd bymod-ext
cp manifests/manifest-firefox.json public/manifest.json
npm run dev

## Build for Chrome
cd bymod-ext
cp manifests/manifest-chrome.json public/manifest.json
npm run dev