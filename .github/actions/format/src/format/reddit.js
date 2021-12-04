const { htmlToText } = require(`html-to-text`);
const ellipsize = require("ellipsize");

module.exports = function (outputs) {
  outputs = outputs.map((item) => {
    let excerpt = "";
    if (item.selftext_html) {
      excerpt = htmlToText(item.selftext_html, {
        tags: {
          a: {
            options: {
              hideLinkHrefIfSameAsText: true,
            },
          },
        },
      });
    }
    item.the_new_excerpt = ellipsize(excerpt, 300);
    return item;
  });

  return outputs;
};
