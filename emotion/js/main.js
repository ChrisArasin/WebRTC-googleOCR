"use strict";

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
  video: true
};

// Video element where stream will be placed.
const video = document.querySelector("video");
const canvas = document.querySelector("canvas");
const photoContext = canvas.getContext("2d");
const emotionDisplay = document.querySelector("#emotion");
const results = document.querySelector("#results");
const apiKey = "AIzaSyArgfk_IaMRCgr_4ODb0L1DAp00TwerF5M";

function snapPhoto() {
  photoContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  postImageToGoogle();
}

var isKeyDown = false;

window.addEventListener("keydown", function(e) {
  isKeyDown = true;
});

window.addEventListener("keyup", function(e) {
  isKeyDown = false;
});

setInterval(function() {
  if (isKeyDown) {
    snapPhoto();
  }
}, 500);

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  video.onloadedmetadata = function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  };
  video.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
  console.log("navigator.getUserMedia error: ", error);
}

// turn canvas into base64 image data
// send request to google OCR

function likelihoodScore(likelihood) {
  switch (likelihood) {
    case "POSSIBLE":
      return 1;
    case "LIKELY":
      return 2;
    case "VERY_LIKELY":
      return 3;
    default:
      return 0;
  }
}
function postImageToGoogle() {
  const imgData = canvas.toDataURL().replace("data:image/png;base64,", "");
  const request = {
    requests: [
      {
        image: { content: imgData },
        features: [
          {
            type: "FACE_DETECTION"
          }
        ]
      }
    ]
  };

  axios
    .post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      request
    )
    .then(function(response) {
      const data = response.data.responses[0].faceAnnotations[0];
      console.log(data);
      const emotions = [
        { emotion: "anger", score: likelihoodScore(data.angerLikelihood) },
        { emotion: "joy", score: likelihoodScore(data.joyLikelihood) },
        { emotion: "sorrow", score: likelihoodScore(data.sorrowLikelihood) },
        { emotion: "surprise", score: likelihoodScore(data.surpriseLikelihood) }
      ];
      console.log(emotions);
      displayEmoji(emotions, data.rollAngle);

      // console.log(response.data.responses[0].fullTextAnnotation.text);
      // const textResult = response.data.responses[0].fullTextAnnotation.text;
      // results.innerHTML = textResult;
    })
    .catch(function(error) {
      console.log(error);
    });
}

function displayEmoji(emotions, rollAngle) {
  emotions.sort((a, b) => a.score < b.score);
  if (emotions[0].score === 0) {
    emotions.unshift({ emotion: "none" });
  }
  emotionDisplay.className = emotions[0].emotion;
  emotionDisplay.style.transform = `rotate(${rollAngle}deg)`;
}

// Initializes media stream.
navigator.getUserMedia(
  mediaStreamConstraints,
  gotLocalMediaStream,
  handleLocalMediaStreamError
);
