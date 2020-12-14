const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { relative, resolve } = path;
const { readdir, readFile, writeFile } = fs;
const CWD = process.env.GITHUB_WORKSPACE;
console.log("CWD", CWD);

async function main({ dest = "./i18n/post-resource" } = {}) {
  const absoluteDest = resolve(CWD, dest);

  const dirents = await readdir(absoluteDest);
  console.log("\n");
  for (let a = 0; a < dirents.length; a++) {
    const locale = dirents[a];
    if (locale.startsWith(".")) {
      continue;
    }
    if (locale === "en") {
      continue;
    }
    console.log("locale", locale);
    const files = await getFiles(resolve(absoluteDest, locale), ".json");
    console.log(`There are ${files.length} files.`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filenameArr = file.split("_--_");
      if (filenameArr.length < 4) {
        throw new Error(`file name invalid: ${file}`);
      }
      const field = filenameArr[2];

      const jsonPath = resolve(CWD, file);
      const jsonContent = await readFile(jsonPath, "utf8");
      let jsonObj = JSON.parse(jsonContent);
      const keys = Object.keys(jsonObj);
      for (let j = 0; j < keys.length; j++) {
        const sourcePath = keys[j];
        const text = jsonObj[sourcePath];
        const sourceAbsolutePath = resolve(CWD, sourcePath);
        const sourceJson = await readFile(sourceAbsolutePath, "utf8");
        const sourceObj = JSON.parse(sourceJson);
        let isChanged = false;
        if (!sourceObj.i18nResource) {
          sourceObj.i18nResource = {};
          isChanged = true;
        }
        if (!sourceObj.i18nResource[locale]) {
          sourceObj.i18nResource[locale] = {};
          isChanged = true;
        }
        if (sourceObj.i18nResource[locale][field] !== text) {
          sourceObj.i18nResource[locale][field] = text;
          isChanged = true;
        }
        if (isChanged) {
          console.log(`Write ${sourceAbsolutePath}`);
          await writeFile(
            sourceAbsolutePath,
            JSON.stringify(sourceObj, null, 2)
          );
        }
      }
    }
  }

  return true;
}
async function getFiles(dir, ext) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      const relativePath = relative(CWD, res);
      return dirent.isDirectory() ? getFiles(res) : relativePath;
    })
  );
  return Array.prototype.concat(...files).filter((item) => {
    console.log("item", item);

    if (ext) {
      return path.extname(item) === ext;
    } else {
      return true;
    }
  });
}

module.exports = main;
