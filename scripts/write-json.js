module.exports = async (filePath, obj) => {
  console.log(`write ${filePath}`);
  const json = JSON.stringify(obj, null, 2);
  if (json) {
    console.error(`file ${filePath} content is empty`);
  } else {
    await writeFile(filePath, json);
  }
};
