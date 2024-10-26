# Bring Your Own Moderation (BYOMod)
A browser extension that gives you control over moderating the content you see on social media sites. You can enter one or more block lists, and the extension will block X/Twitter accounts that are on the block list.

You can install the extension from the [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/byomod/) or [Chrome Web Store](https://chromewebstore.google.com/detail/byomod/ajepjokbaihaaepgghddolomepkfkdkj).

An example block list is available at https://byomod.org/lists/dathes.yaml. This list has 1200+ X/Twitter accounts that will be blocked if you load the list in the extension.

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


## Generating a block list

To generate a block list, you can either edit YAML directly or you can use the tools/modlist.py script to generate a block list from a CSV or an Excel file. The tests/collateral directory has a CSV file and an Excel file that you can use as a starting point.

After editing the excel or csv file, you can generate the file with the block list.
```bash
pipenv install
pipenv run python tools/modlist.py --workbook tests/collateral/blocklist.csv --yaml my_blocklist.yaml
```

If you have access to a webserver then you can upload the yaml file there. Alternatively, you can email
the YAML file to steven+byomod@byoda.org and I will host it for you under https://byomod.org/lists/your_blocklist.yaml.
