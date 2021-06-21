const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data"));
  const jsonFiles = micromatch(files, "**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const type = getType(jsonFiles[i]);
    const types = ["reddit", "hn", "tweet"];
    if (types.includes(type)) {
      const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
      const jsonContent = await readFile(jsonPath, "utf8");
      const json = JSON.parse(jsonContent);
      const newJson = exports.format(type, json);
      console.log(`Write ${jsonFiles[i]}`);
      await fs.writeFile(jsonPath, JSON.stringify(newJson, null, 2));
    }
  }
}
exports.main = main;
exports.format = (type, item) => {
  if (type === "reddit") {
    const {
      title,
      created_utc,
      selftext_html,
      score,
      preview,
      permalink,
      subreddit,
      id,
      is_self,
      media,
      is_video,
      localize,
      the_new_excerpt,
      original_created_utc,
      source_updated_at,
      author,
    } = item;
    return {
      author,
      the_new_excerpt,
      original_created_utc,
      localize,
      title,
      created_utc,
      selftext_html,
      score,
      preview,
      permalink,
      subreddit,
      id,
      is_self,
      media,
      is_video,
      source_updated_at,
    };
  } else if (type === "hn") {
    const {
      created_at,
      title,
      url,
      author,
      points,
      num_comments,
      _tags,
      objectID,
      original_created_at,
      localize,
      source_updated_at,
      image,
    } = item;
    return {
      created_at,
      title,
      url,
      author,
      points,
      num_comments,
      _tags,
      objectID,
      original_created_at,
      localize,
      source_updated_at,
      image,
    };
  } else if (type === "tweet") {
    let {
      created_at,
      id_str,
      full_text,
      display_text_range,
      entities,
      user,
      retweet_count,
      favorite_count,
      possibly_sensitive,
      original_created_at,
      localize,
      source_updated_at,
      retweeted_status,
      quoted_status,
    } = item;
    const { name, screen_name, profile_image_url_https } = user;
    if (retweeted_status) {
      retweeted_status = exports.format("tweet", retweeted_status);
    }
    if (quoted_status) {
      quoted_status = exports.format("tweet", quoted_status);
    }
    return {
      created_at,
      id_str,
      full_text,
      display_text_range,
      entities,
      user: { name, screen_name, profile_image_url_https },
      retweet_count,
      favorite_count,
      possibly_sensitive,
      original_created_at,
      localize,
      source_updated_at,
      retweeted_status,
      quoted_status,
    };
  }
  return item;
};

function getType(path) {
  const pathArr = path.split("/");
  const folder = pathArr[1];
  if (folder === "db") {
    return "db";
  } else if (folder.endsWith("-issues")) {
    return "issue";
  } else if (folder.endsWith("-placeholder")) {
    return "placeholder";
  } else {
    const folderArr = folder.split("-");
    return folderArr[0];
  }
}

async function getFiles(dir) {
  const cwd = process.cwd();
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : relative(cwd, res);
    })
  );
  return Array.prototype.concat(...files);
}
