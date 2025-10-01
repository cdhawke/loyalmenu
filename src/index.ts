import axios from 'axios';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

const transformTitle = (s: string) => {
  const entreesRegex = /E\s*N\s*T\s*R\s*É\s*E\s*S/;
  const platsRegex = /P\s*L\s*A\s*T\s*S/;
  const dessertsRegex = /D\s*E\s*S\s*S\s*E\s*R\s*T\s*S/;

  if (entreesRegex.test(s)) return '\n**ENTRÉES**\n';
  if (platsRegex.test(s)) return '\n**PLATS**\n';
  if (dessertsRegex.test(s)) return '\n**DESSERTS**\n';

  return s;
};

const combineCharacters = (items: any[]) => {
  let combinedText = '';
  for (let i = 0; i < items.length; i++) {
    if (items[i].str.trim() !== '') {
      if (i > 0 && items[i].transform[5] === items[i - 1].transform[5]) {
        combinedText += items[i].str;
      } else {
        combinedText += `\n${items[i].str}`;
      }
    }
  }
  return combinedText;
};

const extractText = async () => {
  const url =
    'https://www.loyalcafe.fr/wp-content/uploads/2016/07/MENU-DU-JOUR.pdf';
  const loadingTask = getDocument(url);

  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const items = content.items as TextItem[];

  const filtered = (content.items as TextItem[])
    .filter((i) => {
      return (
        i.str.trim() !== '' && // Filter out empty strings
        i.transform[5] > 130 && // Filter out the drinks footer
        i.transform[5] < 670 && // Filter out the date header
        !i.str.trim().match(/[0-9.]+€/g) // Filter out prices
      );
    })
    .sort((item1: TextItem, item2: TextItem) => {
      return item2.transform[5] - item1.transform[5]; // sort by y
    });

  const combinedText = combineCharacters(filtered);
  const lines = combinedText
    .split('\n')
    .map((line: string) => transformTitle(line.trim()));

  return lines.join('\n').trim();
};
exports.extractText = extractText;

// Handler
exports.handler = async function () {
  const text = await extractText();

  if (process.env.SLACK_WEBHOOK_URL === undefined) {
    throw new Error('SLACK_WEBHOOK_URL is not defined');
  }

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

var formatResponse = function (body: string) {
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

var formatError = function (error: any) {
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

var serialize = function (object: string) {
  return JSON.stringify(object, null, 2);
};
