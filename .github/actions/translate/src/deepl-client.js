const { translate, quit } = require("./deepl");
module.exports = class DeeplClient {
  async TextTranslate(params) {
    const setence = params.SourceText;
    const source = params.Source;
    let target = params.Target === "zh" ? "zh-ZH" : params.Target;
    if (params.Target === "ja") {
      target = "ja-JA";
    }
    // console.log("setence", source, target, setence);
    return await translate(setence, source, target).then((data) => {
      console.log("result", data.target.translation);
      return {
        TargetText: data.target.translation,
      };
    });
  }
  async quit() {
    await quit();
  }
  provider() {
    return "deepl";
  }
};
