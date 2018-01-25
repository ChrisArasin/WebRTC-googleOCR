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
const results = document.querySelector("#results");
const apiKey = "YOUR API KEY";
const youtubeFrame = document.querySelector("iframe");

function snapPhoto() {
  photoContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  postImageToGoogle();
}

window.addEventListener("keypress", function(e) {
  snapPhoto();
});

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
function postImageToGoogle() {
  const imgData = canvas.toDataURL().replace("data:image/png;base64,", "");
  const request = {
    requests: [
      {
        image: { content: imgData },
        features: [{ type: "TEXT_DETECTION" }]
      }
    ]
  };

  axios
    .post(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      request
    )
    .then(function(response) {
      console.log(response);
      console.log(response.data.responses[0].fullTextAnnotation.text);
      const textResult = response.data.responses[0].fullTextAnnotation.text;
      results.innerHTML = textResult;
      youtubeSearch(textResult);
    })
    .catch(function(error) {
      console.log(error);
    });
}

function youtubeSearch(searchQuery) {
  const youtubeapiQuery = `https://www.googleapis.com/youtube/v3/search?part=snippet&key=${apiKey}&type=video&q=${encodeURIComponent(
    searchQuery
  )}`;
  axios.get(youtubeapiQuery).then(function(response) {
    console.log(response);

    const videoId = response.data.items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    youtubeFrame.src = videoUrl;
  });
}

// Initializes media stream.
navigator.mediaDevices
  .getUserMedia(mediaStreamConstraints)
  .then(gotLocalMediaStream)
  .catch(handleLocalMediaStreamError);
