const axios = require('axios');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

const transformTitle = (s) => {
  if (s.startsWith('E N T R É E S')) return '\n**ENTRÉES**';
  if (s.startsWith('P L A T S')) return '\n**PLATS**';
  if (s.startsWith('D E S S E R T S')) return '\n**DESSERTS**';
  return s;
}

const extractText = async () => {
  const url =
    'https://www.loyalcafe.fr/wp-content/uploads/2016/07/MENU-SUR-PLACE.pdf';
  const loadingTask = pdfjs.getDocument(url);

  const pdf = await loadingTask.promise;

  const metadata = await pdf.getMetadata();
  console.log(metadata.metadata);

  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const items = content.items.filter(i =>
    i.str.trim() != ''
    && !i.str.includes("TOUS NOS POISSONS & VIANDE")
    && !i.str.includes("M E N U")
    && i.transform[4] < 100 // x < 100
  )
  .sort((item1, item2) => {
    return item2.transform[5] - item1.transform[5]; // sort by y
  })
  .map(i => i.str)
  .map(s => transformTitle(s));

  return items.join('\n');
};
exports.extractText = extractText;

// Handler
exports.handler = async function () {
  const text = await extractText();

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
