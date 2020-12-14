const core = require("@actions/core");
const tencentcloud = require("tencentcloud-sdk-nodejs");
const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const translate = require("./translate");
const { readdir } = fs;
const { resolve, relative } = path;
const githubWorkspace =
  process.env.GITHUB_WORKSPACE || path.resolve(__dirname, "../../../../");
async function main() {
  const TmtClient = tencentcloud.tmt.v20180321.Client;

  const clientConfig = {
    credential: {
      secretId: core.getInput("secret_id"),
      secretKey: core.getInput("secret_key"),
    },
    region: "na-siliconvalley",
    profile: {
      httpProfile: {
        endpoint: "tmt.tencentcloudapi.com",
      },
    },
  };

  const client = new TmtClient(clientConfig);
  const locales = ["zh"];
  const allFiles = await getFiles("./i18n/post-resource/en");
  console.log("allFiles", allFiles);

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const enSourceObj = require(`${githubWorkspace}/${file}`);

    const filename = path.basename(file, ".json");
    let zhSourceObj = {};
    for (let j = 0; j < locales.length; j++) {
      const locale = locales[j];
      const targetFilePath = `i18n/post-resource/${locale}/${filename}.json`;

      const targetAbsoluteFilePath = path.resolve(
        githubWorkspace,
        targetFilePath
      );
      console.log("targetAbsoluteFilePath", targetAbsoluteFilePath);

      const ifLocaleFileExist = fsPure.existsSync(targetAbsoluteFilePath);
      if (!ifLocaleFileExist) {
        await fs.writeFile(targetAbsoluteFilePath, "{}");
      }
      const targetJSON = await fs.readFile(targetAbsoluteFilePath, "utf8");
      const targetObj = JSON.parse(targetJSON);
      // check
      const enKeys = Object.keys(enSourceObj);
      let isChanged = false;
      for (let k = 0; k < enKeys.length; k++) {
        const key = enKeys[k];
        const value = enSourceObj[key];
        if (value && targetObj[key] === undefined) {
          isChanged = true;
          const data = await translate({
            client,
            sourceText: value,
            source: "en",
            target: locale,
          });
          // request
          targetObj[key] = data.TargetText;
        }
      }
      zhSourceObj = targetObj;
      // if changed
      if (isChanged) {
        // write
        console.log(`Write ${targetAbsoluteFilePath}`);
        await fs.writeFile(
          targetAbsoluteFilePath,
          JSON.stringify(targetObj, null, 2)
        );
      }
    }

    // translate zh to zh-Hant

    const zhHantTarget = `i18n/post-resource/zh-Hant/${filename}.json`;
    const zhHantTargetAbsolutePath = path.resolve(
      githubWorkspace,
      zhHantTarget
    );
    const ifLocaleFileExist = fsPure.existsSync(zhHantTargetAbsolutePath);
    if (!ifLocaleFileExist) {
      await fs.writeFile(zhHantTargetAbsolutePath, "{}");
    }
    const zhHantTargetJSON = await fs.readFile(
      zhHantTargetAbsolutePath,
      "utf8"
    );
    const zhHantObj = JSON.parse(zhHantTargetJSON);
    // check
    const i18nKeys = Object.keys(zhSourceObj);
    let isChanged = false;
    for (let k = 0; k < i18nKeys.length; k++) {
      const key = i18nKeys[k];
      const value = zhSourceObj[key];
      if (value && zhHantObj[key] === undefined) {
        isChanged = true;
        const data = await translate({
          client,
          sourceText: value,
          source: "zh",
          target: "zh-Hant",
        });
        // request
        zhHantObj[key] = data.TargetText;
      }
    }
    // if changed
    if (isChanged) {
      // write
      console.log(`Write ${zhHantTargetAbsolutePath}`);
      await fs.writeFile(
        zhHantTargetAbsolutePath,
        JSON.stringify(zhHantObj, null, 2)
      );
    }
  }

  // translate tag and translations

  const redditZhTagFilePath = `i18n/i18next/zh/translation-tag.json`;
  const zhTagTitle = require(`${githubWorkspace}/${redditZhTagFilePath}`);

  const redditZhCommonFilePath = `i18n/i18next/zh/translation.json`;
  const zhCommon = require(`${githubWorkspace}/${redditZhCommonFilePath}`);

  const zhTodoTranslatedFiles = [
    {
      sourceObj: zhTagTitle,
      ns: `translation-tag`,
    },
    {
      sourceObj: zhCommon,
      ns: `translation`,
    },
  ];
  const targetLocale = "zh-Hant";
  for (let h = 0; h < zhTodoTranslatedFiles.length; h++) {
    const todoTranslatedFile = zhTodoTranslatedFiles[h];
    const redditLocaleTitleFilePath = `i18n/i18next/${targetLocale}/${todoTranslatedFile.ns}.json`;
    const finalFile = `${githubWorkspace}/${redditLocaleTitleFilePath}`;
    const ifLocaleFileExist = fsPure.existsSync(finalFile);
    if (!ifLocaleFileExist) {
      await fs.writeFile(finalFile, "{}");
    }
    const localeTitleJSON = await fs.readFile(finalFile, "utf8");
    const localeTitle = JSON.parse(localeTitleJSON);
    // check
    const enKeys = Object.keys(todoTranslatedFile.sourceObj);
    let isChanged = false;
    for (let k = 0; k < enKeys.length; k++) {
      const key = enKeys[k];
      const value = todoTranslatedFile.sourceObj[key];
      if (value && localeTitle[key] === undefined) {
        isChanged = true;
        const data = await translate({
          client,
          sourceText: value,
          source: "zh",
          target: targetLocale,
        });
        // request
        localeTitle[key] = data.TargetText;
      }
    }
    // if changed
    if (isChanged) {
      // write
      console.log(`Write ${finalFile}`);

      await fs.writeFile(finalFile, JSON.stringify(localeTitle, null, 2));
    }
  }
}
async function getFiles(dir) {
  const cwd = githubWorkspace;
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : relative(cwd, res);
    })
  );
  return Array.prototype.concat(...files);
}
main()
  .catch((e) => {
    core.setFailed(e);
  })
  .then(() => {
    core.setOutput("success", true);
  });
