const replaceAll = require("string.prototype.replaceall");

module.exports = (data) => {
  if (data.Source === "en" && data.Target === "zh" && data.TargetText) {
    data.TargetText = replaceAll(data.TargetText, /%%/g, " ");
  }
  return data;
};
