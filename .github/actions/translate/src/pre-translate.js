const zhJson = require("./locales/zh.json");
const replaceAll = require("string.prototype.replaceall");

const locales = {
  zh: zhJson,
};
module.exports = ({ text, lang = "zh" }) => {
  if (lang && locales[lang]) {
    const locale = locales[lang];
    const keys = Object.keys(locale);
    keys.forEach((key) => {
      const value = locale[key];
      text = replaceAll(text, key, value);
    });
  }
  return text;
};
