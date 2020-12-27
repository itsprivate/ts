const metascraper = require("metascraper")([require("metascraper-image")()]);
const got = require("got");

module.exports = async function getMetadata(targetUrl) {
  const { body: html, url } = await got(targetUrl);
  const metadata = await metascraper({ html, url });
  return metadata;
};
