const preTranslate = require("./pre-translate");
const OpenCC = require("opencc");
const converter = new OpenCC("s2t.json");

module.exports = async ({
  client,
  sourceText,
  source = "en",
  target = "zh",
}) => {
  let preSourceText = sourceText;
  if (source === "en") {
    preSourceText = preTranslate({
      text: sourceText,
      lang: target,
    });
  }

  console.log("preSourceText", preSourceText);
  if (source === "zh" && target === "zh-Hant") {
    return converter.convertPromise(sourceText).then((converted) => {
      console.log(converted); // 漢字
      return {
        TargetText: converted,
      };
    });
  }
  if (!preSourceText) {
    return {
      TargetText: preSourceText,
    };
  }
  const params = {
    SourceText: preSourceText,
    Source: source,
    Target: target,
    ProjectId: 0,
  };

  const data = await client.TextTranslate(params);
  return data;
};
