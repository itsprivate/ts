const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const getMeta = require("./get-metadata/mac.index");

const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data/redirect-newstop"));
  const jsonFiles = micromatch(files, "**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const jsonContent = await readFile(jsonPath, "utf8");
    let json = JSON.parse(jsonContent);

    if (json && json.image === undefined) {
      // get metadata
      const meta = await getMeta(json.url || json.link);
      if (meta && meta.image) {
        json.image = meta.image;
      } else {
        json.image = "";
      }
      console.log(`write ${jsonPath}`);
      await writeFile(jsonPath, JSON.stringify(json, null, 2));
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
