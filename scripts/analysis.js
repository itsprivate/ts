const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const { readdir } = require("fs").promises;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data/reddit-top"));
  const jsonFiles = micromatch(files, "**/*.json");
  const dataMap = {};
  const result = {};
  for (let i = 0; i < jsonFiles.length; i++) {
    let json = require(resolve(__dirname, "../", jsonFiles[i]));
    let score = json.score;
    let created = json.created_utc * 1000;
    const date = new Date(created);
    let day =
      date.getUTCFullYear() +
      "-" +
      (date.getUTCMonth() + 1) +
      "-" +
      date.getUTCDate();
    if (!dataMap[day]) {
      dataMap[day] = [];
    }
    dataMap[day].push({
      score: score,
    });
  }
  const dateKeys = Object.keys(dataMap);
  dateKeys.forEach((dateKey) => {
    const dateData = dataMap[dateKey];
    result[dateKey] = {
      count: dateData.length,
      gt70: dateData.filter((item) => {
        return item.score > 70000;
      }).length,
      gt75: dateData.filter((item) => {
        return item.score > 75000;
      }).length,
      gt80: dateData.filter((item) => {
        return item.score > 80000;
      }).length,
    };
  });
  console.log("result", result);
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
