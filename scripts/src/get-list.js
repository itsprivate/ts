const Youtube = require("youtube-api");
const Reddit = require("reddit");
Youtube.authenticate({
  type: "key",
  key: process.env.YOUTUBE_API_KEY,
});
const redditInit = {
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_APP_SECRET,
  userAgent: "TopicSource/1.0.0 (https://www.buzzing.cc)",
};

const reddit = new Reddit(redditInit);
exports.getList = async ({ type, params }) => {
  console.log("type, params", type, params);

  if (type === "youtube") {
    const results = await Youtube.videos.list({
      part: "statistics",
      id: params.map((param) => param.id).join(","),
    });
    return generateObj(results.data.items, "id");
  } else if (type === "reddit") {
    // Submit a link to the /r/BitMidi subreddit
    const res = await reddit.get("/api/info", {
      id: params.map((param) => param.name).join(","),
    });
    return generateObj(
      res.data.children.map((item) => item.data),
      "name"
    );
  } else {
    return {};
  }
};

function generateObj(items, key) {
  const itemsObj = {};
  items.forEach((item) => {
    itemsObj[item[key]] = item;
  });
  return itemsObj;
}
