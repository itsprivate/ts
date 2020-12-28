const Youtube = require("youtube-api");
const Reddit = require("reddit");
const axios = require("axios");
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
  } else if (type === "hn") {
    console.log("params", params);

    const promises = params
      .map((item) => item.id)
      .map((id) => {
        return axios
          .get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then((data) => {
            console.log("data1", data);

            return data.data;
          });
      });
    const hnResults = await Promise.all(promises).then((data) => {
      console.log("data", data);

      return data.filter((item) => !!item).map((item) => item);
    });
    return generateObj(hnResults, "id");
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
