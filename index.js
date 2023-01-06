const axios = require('axios');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

const run = async () => {
  const url =
    'https://www.loyalcafe.fr/wp-content/uploads/2016/07/MENU-SUR-PLACE.pdf';
  const loadingTask = pdfjs.getDocument(url);

  const pdf = await loadingTask.promise;

  const metadata = await pdf.getMetadata();
  console.log(metadata.metadata);
  console.log(metadata.info);

  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const xcoord = content.items.find(
    (item) =>
      item.str.startsWith('E N T R É E S') ||
      item.str.startsWith('D E S S E R T S') ||
      item.str.startsWith('P L A T S')
  )?.transform[4];

  return content.items
    .filter(
      (item) =>
        item.hasEOL && item.width > 0 && item.transform[4] <= xcoord + 50
    )
    .sort((item1, item2) => {
      return item2.transform[5] - item1.transform[5];
    })
    .map((item) => {
      if (
        item.str.startsWith('D E S S E R T S') ||
        item.str.startsWith('P L A T S')
      ) {
        return `\n${item.str}`;
      }
      return item.str;
    })
    .join('\n');
};

// Handler
exports.handler = async function () {
  const text = await run();

  // Post to slack
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    menu: text,
  });

  try {
    return formatResponse(serialize(text));
  } catch (error) {
    return formatError(error);
  }
};

var formatResponse = function (body) {
  var response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    isBase64Encoded: false,
    body: body,
  };
  return response;
};

var formatError = function (error) {
  var response = {
    statusCode: error.statusCode,
    headers: {
      'Content-Type': 'text/plain',
      'x-amzn-ErrorType': error.code,
    },
    isBase64Encoded: false,
    body: error.code + ': ' + error.message,
  };
  return response;
};

var serialize = function (object) {
  return JSON.stringify(object, null, 2);
};
