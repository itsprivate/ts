require("dotenv").config();
const translate = require("./translate");
const preTranslate = require("./pre-translate");
function translateTest() {
  translate({
    secretId: process.env.TENCENT_TRANSLATION_SECRET_ID,
    secretKey: process.env.TENCENT_TRANSLATION_SECRET_KEY,
    sourceText:
      "TIL that In 2018, A hacker broke into people’s routers (100,000 of them) and patched their vulnerabilities up so that they couldn’t be abused by other hackers.",
  })
    .catch((e) => {
      console.error("e", e);
    })
    .then((data) => {
      console.log("data", data);
    });
}

function translateTr() {
  translate({
    secretId: process.env.TENCENT_TRANSLATION_SECRET_ID,
    secretKey: process.env.TENCENT_TRANSLATION_SECRET_KEY,
    source: "zh",
    target: "zh-Hant",
    sourceText:
      "叶片在接近100%的湿度下旋转会产生低压气囊--字面意思是让它下雨。",
  })
    .catch((e) => {
      console.error("e", e);
    })
    .then((data) => {
      console.log("data", data);
    });
}

function preTranslateTest() {
  const text = preTranslate({
    text: "[OP] TIL Hello world TIL",
  });
  console.log("text", text);
}
// preTranslateTest();
translateTr();
