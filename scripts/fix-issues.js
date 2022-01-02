const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const { clear } = require("console");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data"));
  const jsonFiles = micromatch(files, "data/*-issues/**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    // console.log("jsonPath", jsonPath);
    const jsonString = await readFile(jsonPath, "utf8");
    let jsonContent = JSON.parse(jsonString);

    if (jsonContent) {
      // console.log("Empty file found");
      // console.log(jsonPath);
      if (jsonContent.items) {
        let isChanged = false;
        for (let j = 0; j < jsonContent.items.length; j++) {
          // console.log("jsonContent.items[j].slug", jsonContent.items[j].slug);

          if (!jsonContent.items[j].slug.endsWith("/")) {
            isChanged = true;
            jsonContent.items[j].slug = jsonContent.items[j].slug + "/";
          }
        }
        if (isChanged) {
          console.log("write", jsonPath);

          await writeFile(jsonPath, JSON.stringify(jsonContent, null, 2));
        }
      }
    }
  }
}

main().catch((e) => {
  console.error("e", e);
});

async function getFiles(dir) {
  const cwd = process.cwd();
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : relative(cwd, res);
    })
  );
  return Array.prototype.concat(...files);
}
