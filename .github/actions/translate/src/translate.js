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
  let untranslatedText;
  if (source === "en") {
    const { text, untranslatedText: untranslatedTextResult } = preTranslate({
      text: sourceText,
      lang: target,
    });
    preSourceText = text;
    untranslatedText = untranslatedTextResult;
  }

  if (source === "zh" && target === "zh-Hant") {
    return converter.convertPromise(sourceText).then((converted) => {
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
  if (untranslatedText) {
    params.UntranslatedText = untranslatedText;
  }

  const data = await client.TextTranslate(params);
  return data;
};
