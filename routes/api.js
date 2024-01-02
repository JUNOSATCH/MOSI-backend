const express = require('express');
const axios = require('axios');
const fs = require('fs');
const fsPromise = require("fs").promises;
const fsExtra = require("fs-extra");
const FormData = require('form-data');
const multer = require("multer");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const db = require("../config/database");
const { createResponse } = require("./create_response");
const { convertTextToSpeech } = require("./texttospeech");

// create audios dir
try {
  fs.readdirSync('audios');
} catch(err) {
  console.error("no directory 'audios', created one");
  fs.mkdirSync('audios');
}

// create dialogues dir
try {
  fs.readdirSync('dialogues');
} catch(err) {
  console.error("no directory 'dialogues', created one");
  fs.mkdirSync('dialogues');
}

const lambdaUrl = process.env.LAMBDA_URL;
const basePath = process.env.BASE_PATH;
const audioPath = basePath + "/audios";
const dialoguePath = basePath + "/dialogues";

const countFiles = async (directoryPath) => {
  try {
    const files = await fsPromise.readdir(directoryPath);
    return files.length;
  } catch (err) { throw err; }
}

class ClovaSpeechClient {
  invokeUrl = process.env.CLOVA_URL;
  secret = process.env.CLOVA_KEY;

  async reqUrl(url, completion, callback = null, userdata = null, forbiddens = null, boostings = null, wordAlignment = true, fullText = true, diarization = null) {
    const requestBody = {
      url,
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
      'Content-Type': 'application/json;UTF-8',
      'X-CLOVASPEECH-API-KEY': this.secret,
    };

    const response = await axios.post(`${this.invokeUrl}/recognizer/url`, requestBody, { headers });
    return response.data;
  }

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

// 1인 발화 경우
const stemDialogue = (result) => {
  const dialogue = [];
  result.segments.forEach(segment => {
    dialogue.push(segment.text);
  });
  return dialogue;
}

// 비윤리성 체크
const predict = async (sentences) => {
  const body = JSON.stringify({ sentences });
  const response = await axios.post(lambdaUrl, { body }, { 'Content-Type': 'application/json' });
  return await JSON.parse(response.data.body).result;
}


const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { cb(null, 'audios/'); },
    async filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = await countFiles(audioPath);
      const name = base/2;
      cb(null, name + ext);
    }
  })
});

const audioUpload = upload.fields([
  { name: "parent" },
  { name: "teacher" },
  { name: "file" }
]);


router.post("/dialogue", audioUpload, async (req, res, next) => {
  console.log(req.files.file[0].path);
  const wavFilePath = path.join(basePath, req.files.file[0].path);
  const mp3FilePath = wavFilePath.replace(".wav", ".mp3");

  ffmpeg()
  .input(wavFilePath)
  .audioCodec('libmp3lame')  // MP3 코덱을 사용
  .toFormat('mp3')           // MP3 포맷으로 변환
  .on('end', async () => {
    // 변환 완료되면 시작
    console.log('Conversion finished!');

    // mp3 -> text
    const client = new ClovaSpeechClient();
    const transformResult = await client.reqUpload(mp3FilePath, 'sync');
    const dialogue = stemDialogue(transformResult);
    console.log(dialogue);

    const parentFile = await fsPromise.readFile(`${dialoguePath}/parent.txt`, "utf-8");
    const parentDialogue = parentFile ? JSON.parse(parentFile) : [];
    if (parentDialogue) {
      parentDialogue.push(dialogue[0]);
      await fsPromise.writeFile(`${dialoguePath}/parent.txt`, JSON.stringify(parentDialogue));
    } else { await fsPromise.writeFile(`${dialoguePath}/parent.txt`, JSON.stringify(dialogue)); }

    // text generation
    const answer = await createResponse(dialogue[0], null);

    const teacherFile = await fsPromise.readFile(`${dialoguePath}/teacher.txt`, "utf-8");
    const teacherDialogue = teacherFile ? JSON.parse(teacherFile) : [];
    if (teacherDialogue) {
      teacherDialogue.push(answer);
      await fsPromise.writeFile(`${dialoguePath}/teacher.txt`, JSON.stringify(teacherDialogue));
    } else { await fsPromise.writeFile(`${dialoguePath}/parent.txt`, JSON.stringify([answer])); }

    // text -> mp3
    await convertTextToSpeech(mp3FilePath, answer);
  
    // response
    res.sendFile(mp3FilePath, (err) => {
      if (err) {
        console.error('Error sending MP3 file:', err);
        res.status(err.status).end();
      } else {
        console.log('MP3 file sent successfully.');
      }
    });
  })
  .on('error', (err) => {
    console.error('Error:', err);
  })
  .save(mp3FilePath);

  // res.status(200).json({"success": "true"});
});

router.post("/analysis", async (req, res, next) => {
  const id = req.body.id;
  const name = req.body.name;

  // 파일 읽어오기
  // api 부르기
  // db 저장하기
  // 응답할 객체 만들기
  // 폴더들 비우기
  // 응답하기

  const parentFile = await fsPromise.readFile(`${dialoguePath}/parent.txt`, "utf-8");
  const parentDialogue = parentFile ? JSON.parse(parentFile) : [];

  const teacherFile = await fsPromise.readFile(`${dialoguePath}/teacher.txt`, "utf-8");
  const teacherDialogue = teacherFile ? JSON.parse(teacherFile) : [];

  if (parentDialogue && teacherDialogue) {
    const predictResult = await predict(parentDialogue);
    console.log(predictResult);

    const score = (predictResult.reduce((sum, val) => sum+val, 0)/predictResult.length) * (predictResult.reduce((sum, val) => sum+val, 0)/10) * 100;
    console.log(score);

    const parentResult = [];
    const teacherResult = [];
    const dialogueResult = [];

    for (let i=0; i<parentDialogue.length; i++) {
      parentResult.push({ speaker: "parent", sentence: parentDialogue[i], flag: predictResult[i] });
    }
    for (let i=0; i<teacherDialogue.length; i++) {
      teacherResult.push({ speaker: "teacher", sentence: teacherDialogue[i], flag: 0 });
    }
    console.log(parentResult);
    console.log(teacherResult);

    for (let i=0; i<parentDialogue.length; i++) {
      dialogueResult.push(parentResult[i]);
      dialogueResult.push(teacherResult[i]);
    }

    console.log(JSON.stringify(dialogueResult));

    await fsPromise.writeFile(`${dialoguePath}/parent.txt`, "");
    await fsPromise.writeFile(`${dialoguePath}/teacher.txt`, "");

    await fsExtra.emptyDir(audioPath);

    await db.query("update dialogues set dialogue=?, score=? where id=?;", [JSON.stringify(dialogueResult), score, id]);

    res.status(200).json({ id, username: name, score, dialogue: dialogueResult });
  }
});


module.exports = router;