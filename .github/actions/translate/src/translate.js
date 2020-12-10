const preTranslate = require("./pre-translate");

module.exports = async ({
  client,
  sourceText,
  source = "en",
  target = "zh",
}) => {
  const preSourceText = preTranslate({
    text: sourceText,
    lang: target,
  });
  console.log("preSourceText", preSourceText);
  const params = {
    SourceText: preSourceText,
    Source: source,
    Target: target,
    ProjectId: 0,
  };

  const data = await client.TextTranslate(params);
  return data;
};
