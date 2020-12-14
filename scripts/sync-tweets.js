const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;

const main = async ({
  dest = "data/tweet-stocks",
  name = "tweet-stocks",
} = {}) => {
  const outputs = require(`${process.env.GITHUB_WORKSPACE}/${process.env.OUTPUTS_PATH}`);
  for (let i = 0; i < outputs.length; i++) {
    const item = outputs[i];
    const createdAt = new Date(Date.parse(item.created_at));
    const fileRelativePath = path.join(
      dest,
      `${createdAt.getUTCFullYear()}/${createdAt.getUTCMonth() + 1}/${
        item.id_str
      }.json`
    );
    const tweetFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      fileRelativePath
    );
    console.log(`Write tweet json ${tweetFilePath}`);
    await fs
      .mkdir(path.dirname(tweetFilePath), {
        recursive: true,
      })
      .then(() => {
        return fs
          .writeFile(tweetFilePath, JSON.stringify(item, null, 2), {
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
    const full_text = item.full_text;
    const id = item.id_str;
    const user = item.user;
    const tags = [user.name].concat(
      item.entities.hashtags.map((tag) => tag.text) || []
    );
    const locale = "en";
    const utcYear = createdAt.getUTCFullYear();
    const utcMonth = createdAt.getUTCMonth() + 1;
    const addZeroUtcMonth = utcMonth < 10 ? `0${utcMonth}` : `${utcMonth}`;
    const titleLocaleFileName = `tweet_--_${name}_--_full_text_--_${utcYear}_--_${addZeroUtcMonth}.json`;
    const filePath = `./i18n/post-resource/${locale}/${titleLocaleFileName}`;
    const tagFilePath = `./i18n/i18next/${locale}/translation-tag.json`;

    const isExist = fsPure.existsSync(filePath);
    if (!isExist) {
      await fs.writeFile(filePath, "{}");
    }

    const isTagFileExist = fsPure.existsSync(tagFilePath);
    if (!isTagFileExist) {
      await fs.writeFile(tagFilePath, "{}");
    }

    const localeJson = await fs.readFile(filePath, "utf8");
    const localeObj = JSON.parse(localeJson);
    localeObj[fileRelativePath] = full_text;
    // write
    await fs.writeFile(filePath, JSON.stringify(localeObj, null, 2));
    console.log(`Write ${filePath} success`);

    const tagLocaleJson = await fs.readFile(tagFilePath, "utf8");
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
      await fs.writeFile(tagFilePath, JSON.stringify(tagLocaleObj, null, 2));
      console.log(`Write ${tagFilePath} success`);
    } else {
      console.log(`No changes for tags, skip write tag file`);
    }
    console.log("\n");
  }

  return outputs.length;
};
module.exports = main;
