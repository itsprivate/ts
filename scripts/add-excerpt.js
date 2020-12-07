const format = require("../.github/actions/format/src/format/reddit");
const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const { readdir, readFile, writeFile } = require("fs").promises;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data/reddit-top"));
  const jsonFiles = micromatch(files, "**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const jsonContent = await readFile(jsonPath, "utf8");
    let json = JSON.parse(jsonContent);
    if (json.__excerpt === undefined) {
      const newJson = format([json]);
      console.log("write", jsonPath);
      await writeFile(jsonPath, JSON.stringify(newJson[0], null, 2));
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
