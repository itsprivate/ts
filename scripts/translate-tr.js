require("dotenv").config();
const tencentcloud = require("tencentcloud-sdk-nodejs");

const translate = require("../.github/actions/translate/src/translate");
const TmtClient = tencentcloud.tmt.v20180321.Client;

const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_TRANSLATION_SECRET_ID,
    secretKey: process.env.TENCENT_TRANSLATION_SECRET_KEY,
  },
  region: "na-siliconvalley",
  profile: {
    httpProfile: {
      endpoint: "tmt.tencentcloudapi.com",
    },
  },
};
const client = new TmtClient(clientConfig);
async function main() {
  const value = `Test #WholeLottaRed #PlayboiCarti`;
  const data = await translate({
    client,
    sourceText: value,
    source: "en",
    target: "zh",
  });
  console.log("data", data);
}

main().catch((e) => {
  console.log("e", e);
});
