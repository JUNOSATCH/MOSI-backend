const express = require('express');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const multer = require("multer");
const path = require("path");
const db = require("../config/database");

try {
  fs.readdirSync('audios');
} catch(err) {
  console.error("no directory 'audios', created one");
  fs.mkdirSync('audios');
}

const url = "https://onnfgxou82.execute-api.ap-northeast-2.amazonaws.com/Test/asdfasdf";

class ClovaSpeechClient {
  invokeUrl = "https://clovaspeech-gw.ncloud.com/external/v1/6425/ecdd3e4a16f4cd304b166ab546e96844bf8f04ac41c8a0db88d27f26e23fe11f";
  secret = "aff8370fd4274d04b18a1b0d63565e81";
  // invokeUrl = process.env.CLOVA_URL;
  // secret = process.env.CLOVA_KEY;

  // async reqUrl(url, completion, callback = null, userdata = null, forbiddens = null, boostings = null, wordAlignment = true, fullText = true, diarization = null) {
  //   const requestBody = {
  //     url,
  //     language: 'ko-KR',
  //     completion,
  //     callback,
  //     userdata,
  //     wordAlignment,
  //     fullText,
  //     forbiddens,
  //     boostings,
  //     diarization,
  //   };

  //   const headers = {
  //     'Accept': 'application/json;UTF-8',
  //     'Content-Type': 'application/json;UTF-8',
  //     'X-CLOVASPEECH-API-KEY': this.secret,
  //   };

  //   const response = await axios.post(`${this.invokeUrl}/recognizer/url`, requestBody, { headers });
  //   return response.data;
  // }

  // async reqObjectStorage(dataKey, completion, callback = null, userdata = null, forbiddens = null, boostings = null, wordAlignment = true, fullText = true, diarization = null) {
  //   const requestBody = {
  //     dataKey,
  //     language: 'ko-KR',
  //     completion,
  //     callback,
  //     userdata,
  //     wordAlignment,
  //     fullText,
  //     forbiddens,
  //     boostings,
  //     diarization,
  //   };

  //   const headers = {
  //     'Accept': 'application/json;UTF-8',
  //     'Content-Type': 'application/json;UTF-8',
  //     'X-CLOVASPEECH-API-KEY': this.secret,
  //   };

  //   const response = await axios.post(`${this.invokeUrl}/recognizer/object-storage`, requestBody, { headers });
  //   return response.data;
  // }

  async reqUpload(file, completion, callback = null, userdata = null, forbiddens = null, boostings = null, wordAlignment = true, fullText = true, diarization = null) {
    const requestBody = {
      language: 'ko-KR',
      completion,
      callback,
      userdata,
      wordAlignment,
      fullText,
      forbiddens,
      boostings,
      diarization,
    };

    const headers = {
      'Accept': 'application/json;UTF-8',
      'X-CLOVASPEECH-API-KEY': this.secret,
    };

    const formData = new FormData();
    formData.append('media', fs.createReadStream(file));
    formData.append('params', JSON.stringify(requestBody), { contentType: 'application/json' });

    const response = await axios.post(`${this.invokeUrl}/recognizer/upload`, formData, { headers });
    return response.data;
  }
}

// 화자 분할
const splitDialogue = (result) => {
  const dialogue = [];
  result.segments.forEach(segment => {
    const newSeg = { text: segment.text, speaker: segment.speaker.label };
    dialogue.push(newSeg);
  });
  const teacherSpeech = [];
  const parentSpeech = [];
  dialogue.forEach(segment => {
    if (segment.speaker==1) teacherSpeech.push(segment.text);
    else parentSpeech.push(segment.text);
  });

  return { dialogue, teacherSpeech, parentSpeech };
}

// 비윤리성 체크
const predict = async (sentences) => {
  const body = JSON.stringify({ sentences });
  const response = await axios.post(url, { body }, { 'Content-Type': 'application/json' });
  return await JSON.parse(response.data.body).result;
}


const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { cb(null, 'audios/'); },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    }
  })
});

const audioUpload = upload.fields([
  { name: "parent" },
  { name: "teacher" },
  { name: "file" }
]);


router.post("/new", audioUpload, async (req, res, next) => {
  const client = new ClovaSpeechClient();
  const filePath = path.join("/Users/youngmin/Desktop/SYM/Code/Project/2023Hackathon-Back", req.files.file[0].path);
  const transformResult = await client.reqUpload(filePath, 'sync');
  const splitResult = splitDialogue(transformResult);
  let predictResult;
  if (splitResult.parentSpeech) predictResult = await predict(splitResult.parentSpeech);
  else predictResult = await predict(splitResult.teacherSpeech);
  console.log(predictResult);
  res.status(200).json(predictResult);

  // const formData = new FormData();
  // formData.append(
  //   'file',
  //   fs.createReadStream(path.join("/Users/youngmin/Desktop/SYM/Code/Project/2023Hackerton-Back", req.files.file[0].path)),
  // );
  // const url = 'http://1288-35-201-249-213.ngrok-free.app/audio';
  // const response = await Axios({
  //   method: 'post',
  //   url,
  //   data: formData,
  //   headers: {
  //     ...formData.getHeaders(),
  //   },
  // });
  // res.status(200).json(response.data);
});


module.exports = router;