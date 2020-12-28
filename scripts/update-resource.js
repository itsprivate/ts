require("dotenv").config();

const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { getList } = require("./src/get-list");

const { readdir, readFile, writeFile } = fs;
async function main() {
  const directories = [
    "reddit-top",
    "tweet-stocks",
    "youtube-top",
    "hn-top",
    "ph-top",
  ];
  const now = Date.now();

  const queuesPerGroup = 100;
  const fields = {
    reddit: {
      dateParser: (item) => {
        return new Date(item.created_utc * 1000);
      },
      paramsParser: (item) => {
        return {
          name: item.name,
        };
      },
    },
    youtube: {
      dateParser: (item) => {
        return new Date(item.isoDate);
      },
      paramsParser: (item) => {
        return {
          id: item.videoId,
        };
      },
    },
  };
  let queues = [];
  const period = getLastUpdatedPeriod();
  for (let o = 0; o < directories.length; o++) {
    const directory = directories[o];
    const type = directory.split("-")[0];
    const files = await getFiles(resolve(__dirname, `../data/${directory}`));
    const jsonFiles = micromatch(files, "**/*.json");
    let queueIndex = 0;
    if (type === "youtube" || type === "reddit") {
      for (let i = 0; i < jsonFiles.length; i++) {
        const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
        const jsonContent = await readFile(jsonPath, "utf8");
        let item = JSON.parse(jsonContent);

        let source_updated_at = item.source_updated_at;
        if (
          source_updated_at &&
          now - source_updated_at < 24 * 60 * 60 * 1000
        ) {
          // should not update
          console.log(`${jsonFiles[i]} updated lately, do not need update`);
        } else {
          // get created_at
          const dateParser =
            fields[type] && fields[type].dateParser
              ? fields[type].dateParser
              : (item) => new Date(item.created_at);
          const createdAt = dateParser(item);

          if (createdAt < period.end && createdAt >= period.start) {
            queueIndex++;
            if (queueIndex > 10) {
              break;
            }
            // check created at is belong the issue
            const paramsParser =
              fields[type] && fields[type].paramsParser
                ? fields[type].paramsParser
                : (item) => ({ id: item.id });
            const params = paramsParser(item);

            queues.push({
              type,
              path: jsonPath,
              params: params,
              originalItem: item,
            });
          }
        }
      }
    }
    //           console.log(`write ${jsonPath}`);
    //    await writeFile(jsonPath, JSON.stringify(item, null, 2));
  }

  const groups = [];
  const typeQueues = {};
  queues.forEach((queue) => {
    if (!typeQueues[queue.type]) {
      typeQueues[queue.type] = [];
    }
    typeQueues[queue.type].push(queue);
  });
  const typeKeys = Object.keys(typeQueues);

  typeKeys.forEach((typeKey) => {
    const currentTypeQueues = typeQueues[typeKey];
    const pages = Math.ceil(currentTypeQueues.length / queuesPerGroup);

    for (let k = 0; k < pages; k++) {
      const page = k;
      const group = {
        type: typeKey,
        items: [],
      };
      group.items = currentTypeQueues.slice(
        page * queuesPerGroup,
        page * queuesPerGroup + queuesPerGroup
      );
      groups.push(group);
    }
  });
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const type = group.type;
    const items = group.items;

    const resultObj = await getList({
      type,
      params: items.map((item) => item.params),
    });
    console.log("resultObj", Object.keys(resultObj).length);

    for (let k = 0; k < items.length; k++) {
      const item = items[k];
      const originalItem = item.originalItem;
      if (type === "reddit") {
        if (resultObj && resultObj[item.params.name]) {
          // write
          originalItem.score = resultObj[item.params.name].score;
          originalItem.ups = resultObj[item.params.name].score;

          await writeJson(item.path, originalItem);
        } else {
          console.warn(`there is no ${item.path} update result`);
        }
      } else if (type === "youtube") {
        if (resultObj && resultObj[item.params.id]) {
          // write
          const statics = resultObj[item.params.id].statistics;
          originalItem.statistics.views = statics.viewCount;
          const count =
            Number(statics.likeCount) + Number(statics.dislikeCount);
          originalItem.starRating.count = `${count}`;
          if (statics.likeCount > 0) {
            const average = (Number(statics.likeCount * 5) / count).toFixed(2);
            originalItem.starRating.average = average;
          }
          await writeJson(item.path, originalItem);
        } else {
          console.warn(`there is no ${item.path} update result`);
        }
      }
    }
  }
}

main().catch((e) => {
  console.error("e", e);
});
async function writeJson(filePath, obj) {
  console.log(`write ${filePath}`);
  obj.source_updated_at = new Date().getTime();
  await writeFile(filePath, JSON.stringify(obj, null, 2));
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

function getLastUpdatedPeriod() {
  const now = Date.now();
  const period = 8 * 24 * 60 * 60 * 1000;
  const start = now - period;
  const end = now - 1 * 24 * 60 * 60 * 1000;
  return {
    start,
    end,
  };
}
