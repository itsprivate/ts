const fs = require("fs").promises;
const path = require("path");
const siteMeta = {
  title: `Buzzing on Hacker News`,
  author: `Hacker News`,
  description: `See what's buzzing on Hacker News in your native language`,
  keywords: ["Hacker News", "HN", "buzzing"],
  siteUrl: "https://hn.buzzing.cc",
  menuLinks: [
    {
      name: "RSS",
      url: "/rss.xml",
      prefetch: false,
    },
  ],
  social: [
    {
      name: `Hacker News`,
      url: `https://news.ycombinator.com/`,
      external: true,
    },
  ],
};

async function main() {
  const translations = {};
  const keys = Object.keys(siteMeta);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = siteMeta[key];
    if (key === "siteUrl" || key === "author") {
      continue;
    }
    if (typeof value === "string") {
      translations[value] = value;
    } else {
      if (key === "keywords") {
        siteMeta.keywords.forEach((keyword) => {
          translations[keyword] = keyword;
        });
      }
      if (key === "menuLinks" || key === "social") {
        siteMeta[key].forEach((item) => {
          translations[item.name] = item.name;
        });
      }
    }
  }
  console.log("translations", translations);
  const translationPath = path.resolve(
    __dirname,
    "../i18n/i18next/en/translation.json"
  );
  const translationJson = await fs.readFile(translationPath, "utf8");
  const translationObj = JSON.parse(translationJson);
  const translationsKeys = Object.keys(translations);
  translationsKeys.forEach((key) => {
    if (translationObj[key] === undefined) {
      translationObj[key] = translations[key];
    }
  });
  console.log(`Write ${translationPath}`);
  await fs.writeFile(translationPath, JSON.stringify(translationObj, null, 2));
}

main().catch((e) => {
  console.error("e", e);
});
