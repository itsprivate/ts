const core = require("@actions/core");
const tencentcloud = require("tencentcloud-sdk-nodejs");
const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
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
  const allYears = getAllYears();
  for (let i = 0; i < allYears.length; i++) {
    const year = allYears[i];
    const redditEnTitleFilePath = `i18n/i18next/en/reddit-title-${year}.json`;
    const enTitle = require(`${githubWorkspace}/${redditEnTitleFilePath}`);

    const redditEnExcerptFilePath = `i18n/i18next/en/reddit-excerpt-${year}.json`;
    const enExcerpt = require(`${githubWorkspace}/${redditEnExcerptFilePath}`);
    const todoTranslatedFiles = [
      {
        sourceObj: enTitle,
        ns: `reddit-title-${year}`,
      },
      {
        sourceObj: enExcerpt,
        ns: `reddit-excerpt-${year}`,
      },
    ];
    for (let j = 0; j < locales.length; j++) {
      const locale = locales[j];
      for (let h = 0; h < todoTranslatedFiles.length; h++) {
        const todoTranslatedFile = todoTranslatedFiles[h];
        const redditLocaleTitleFilePath = `i18n/i18next/${locale}/${todoTranslatedFile.ns}.json`;
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
          if (!localeTitle[key]) {
            isChanged = true;
            const params = {
              SourceText: value,
              Source: "en",
              Target: locale,
              ProjectId: 0,
            };
            // special word not translate
            if (key.startsWith("TIL ")) {
              params.UntranslatedText = "TIL";
            }
            const data = await client.TextTranslate(params);
            if (key.startsWith("TIL ")) {
              data.TargetText.replace("TIL", "");
            }
            // request
            localeTitle[key] = data.TargetText;
          }
        }
        // if changed
        if (isChanged) {
          // write
          await fs.writeFile(finalFile, JSON.stringify(localeTitle, null, 2));
        }
      }
    }
  }
}

const getAllYears = () => {
  const currentYears = new Date().getUTCFullYear();
  const allYears = [];
  for (let i = 2020; i <= currentYears + 1; i++) {
    allYears.push(i);
  }
  return allYears;
};
main()
  .catch((e) => {
    core.setFailed(e);
  })
  .then(() => {
    core.setOutput("success", true);
  });
