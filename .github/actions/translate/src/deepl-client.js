const { translate, quit } = require("./deepl");
module.exports = class DeeplClient {
  async TextTranslate(params) {
    const setence = params.SourceText;
    const source = params.Source;
    const target = params.Target === "zh" ? "zh-ZH" : params.Target;
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
