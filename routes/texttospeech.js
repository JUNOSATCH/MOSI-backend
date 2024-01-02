// texttospeech.js
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');

/**
 * Requirements:
 * - Set the environment variable GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON file.
 */

// const basePath = "/Users/youngmin/Desktop/SYM/Code/Project/MOSI/backend";
// const audioPath = "/Users/youngmin/Desktop/SYM/Code/Project/MOSI/backend/audios";

async function convertTextToSpeech(fileName, sentence) {
  // Load content from JSON file
  // const content = fs.readFileSync(`./result/answer/${fileName}.json`, 'utf8');
  // console.log(content);

  // Creates a client
  const client = new textToSpeech.TextToSpeechClient();

  // Set the text input to be synthesized
  // const synthesisInput = { text: content };
  const synthesisInput = { text: sentence };

  // Select the voice parameters
  const voice = {
    languageCode: 'ko-KR',
    ssmlGender: 'FEMALE',
  };

  // Select the type of audio file you want returned
  const audioConfig = {
    audioEncoding: 'MP3',
  };

  // Perform the text-to-speech request
  const [response] = await client.synthesizeSpeech({
    input: synthesisInput,
    voice: voice,
    audioConfig: audioConfig,
  });

  // Save the audio content to a file
  fs.writeFileSync(fileName, response.audioContent, 'binary');
  console.log(`Audio content written to file "${fileName}.mp3"`);
}


module.exports = { convertTextToSpeech };