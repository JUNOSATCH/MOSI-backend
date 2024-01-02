// create_response.js
require('dotenv').config();
const OpenAI = require('openai').OpenAI;
const openai = new OpenAI()
const fs = require('fs');

const OPENAI_API_KEY = require('../../AI/api/key').OPENAI_API_KEY;

openai.apiKey = OPENAI_API_KEY;
const MODEL = process.env.OPENAI_URL;

async function createResponse(inputMes, fileName) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: inputMes }],
  });

  console.log(response.choices[0].message.content)
  const answer = response.choices[0].message.content;

  // Save the response to a JSON file
  // fs.writeFileSync(`./result/answer/${fileName}.json`, JSON.stringify(answer));

  // Read the JSON file to get the content
  // const fileContent = fs.readFileSync(`./result/answer/${fileName}.json`, 'utf8');
  // const res = fileContent;
  const res = answer;

  return res;
}

// Example usage
// createResponse("선생님 안녕하세요?", "exampleFileName");

module.exports = { createResponse };