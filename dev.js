const { extractText } = require('./dist/index.js');

(async () => {
  console.log(await extractText());
})();
