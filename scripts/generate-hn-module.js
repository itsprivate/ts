const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const getMeta = require("./get-metadata");
const main = async ({ dest = "data/hn-top", name = "hn-top" } = {}) => {
  const outputs = require(`${process.env.GITHUB_WORKSPACE}/${process.env.OUTPUTS_PATH}`);
  for (let i = 0; i < outputs.length; i++) {
    const item = outputs[i];
    const originalCreatedAt = new Date(item.original_created_at);
    const fileRelativePath = path.join(
      dest,
      `${originalCreatedAt.getUTCFullYear()}/${
        originalCreatedAt.getUTCMonth() + 1
      }/${item.objectID}.json`
    );
    const hnFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      fileRelativePath
    );
    // get metadata
    const itemUrl = item.url || item.link;
    if (itemUrl) {
      try {
        const meta = await getMeta(itemUrl);
        if (meta && meta.image) {
          item.image = meta.image;
        } else {
          item.image = "";
        }
      } catch (error) {
        console.log("error", error);

        console.warn("get image from ${itemUrl} failed", error);
        item.image = "";
      }
    } else {
      item.image = "";
    }
    console.log(`Write hn json ${hnFilePath}`);
    // is exist
    const isTargetFileExist = fsPure.existsSync(hnFilePath);
    if (isTargetFileExist) {
      const originalJson = await fs.readFile(hnFilePath, "utf8");
      const originalRedditItem = JSON.parse(originalJson);
      item.created_at = originalRedditItem.created_at;
      if (originalRedditItem.localize) {
        item.localize = originalRedditItem.localize;
      }
    }
    await fs
      .mkdir(path.dirname(hnFilePath), {
        recursive: true,
      })
      .then(() => {
        return fs
          .writeFile(hnFilePath, JSON.stringify(item, null, 2), {
            flag: "wx",
          })
          .catch((e) => {
            if (e.code === "EEXIST") {
              return Promise.resolve();
            } else {
              return Promise.reject(e);
            }
          });
      });
    const title = item.title;
    const id = item.objectID;
    let tags = [];
    if (item._tags.length > 0) {
      tags = [item._tags[0]];
      if (item._tags.includes("show_hn")) {
        tags.push("Show HN");
      }
      if (item._tags.includes("ask_hn")) {
        tags.push("ASK HN");
      }
      if (item._tags.includes("poll")) {
        tags.push("Poll");
      }
    }
    const locale = "en";
    const utcYear = originalCreatedAt.getUTCFullYear();
    const utcMonth = originalCreatedAt.getUTCMonth() + 1;
    const addZeroUtcMonth = utcMonth < 10 ? `0${utcMonth}` : `${utcMonth}`;
    const titleLocaleFileName = `hn_--_${name}_--_title_--_${utcYear}_--_${addZeroUtcMonth}.json`;

    const filePath = `./i18n/post-resource/${locale}/${titleLocaleFileName}`;
    const absoluteFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      filePath
    );

    const tagFilePath = `./i18n/i18next/${locale}/translation-tag.json`;
    const absoluteTagFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      tagFilePath
    );
    const isExist = fsPure.existsSync(absoluteFilePath);
    if (!isExist) {
      await fs.writeFile(absoluteFilePath, "{}");
    }

    const isTagFileExist = fsPure.existsSync(absoluteTagFilePath);
    if (!isTagFileExist) {
      await fs.writeFile(absoluteTagFilePath, "{}");
    }

    const localeJson = await fs.readFile(absoluteFilePath, "utf8");
    const localeObj = JSON.parse(localeJson);
    if (title) {
      if (localeObj[fileRelativePath] !== title) {
        localeObj[fileRelativePath] = title;
        // write
        await fs.writeFile(
          absoluteFilePath,
          JSON.stringify(localeObj, null, 2)
        );
        console.log(`Write ${filePath} success`);
      }
    }

    const tagLocaleJson = await fs.readFile(absoluteTagFilePath, "utf8");
    const tagLocaleObj = JSON.parse(tagLocaleJson);
    let isChanged = false;
    tags.forEach((tag) => {
      if (!tagLocaleObj[tag]) {
        isChanged = true;
        tagLocaleObj[tag] = tag;
      }
    });
    if (isChanged) {
      // write
      await fs.writeFile(
        absoluteTagFilePath,
        JSON.stringify(tagLocaleObj, null, 2)
      );
      console.log(`Write ${tagFilePath} success`);
    } else {
      console.log(`No changes for tags, skip write tag file`);
    }
    console.log("\n");
  }

  return outputs.length;
};
module.exports = main;
