const yaml = require("js-yaml");
const config = require('config');
const pluginSass = require("./plugins/sass.js");

const INPUT_DIRECTORY = config.folders.source;
const OUTPUT_DIRECTORY = 'tmp/';

module.exports = eleventyConfig => {
  eleventyConfig.addDataExtension("yaml", contents => yaml.safeLoad(contents));

  eleventyConfig.addPlugin(pluginSass, config.sass);

  const binaryFormats = [
      "gif",
      "jpg",
      "jpeg",
      "mp4",
      "png",
      "webp"
  ];
  eleventyConfig.addTemplateFormats(binaryFormats);

  return {
    dir: {
        input: INPUT_DIRECTORY,
        data: '_data',
        output: OUTPUT_DIRECTORY
      },
  };
};
