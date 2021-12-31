// check files validate
const { resolve, relative } = require("path");
const fsPure = require("fs");
const https = require("https");
const fs = fsPure.promises;
const { readdir, readFile } = fs;
const main = async () => {
  const files = await getFiles("./i18n");
  for (let i = 0; i < files.length; i++) {
    if (files[i].endsWith(".json")) {
      const jsonPath = resolve(__dirname, "../", files[i]);
      const jsonContent = await readFile(jsonPath, "utf8");
      try {
        JSON.parse(jsonContent);
      } catch (e) {
        console.error("error path: ", jsonPath);

        const message = `翻译源文件出错,错误文件:${jsonPath} , 错误内容: ${e.message}`;
        // report
        https.get(
          `https://webhook.actionsflow.workers.dev/theowenyoung/actionsflow-workflow/notice/webhook?__token=${
            process.env.PERSONAL_TOKEN
          }&message=${encodeURIComponent(message)}`,
          () => {}
        );
        await sleep(5000);
        throw e;
      }
    }
  }
};
module.exports = main;
function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
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
