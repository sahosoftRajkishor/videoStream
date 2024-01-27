const express = require("express");
const axios = require("axios");
const cors = require("cors");
const rangeParser = require("range-parser");
const ytdl = require("ytdl-core");
const jwt = require("jsonwebtoken");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;
var videoData;

app.get("/stream/:token/:topicId", async (req, res, next) => {
  let isPlay = 0;
  let objVideoInfo;
  let objInfoUpdate;
  if (req.params.topicId != 10001) getVideoUrl(req.params.topicId);
  try {
    // First API call

    const response1 = await axios.get(
      "https://video-stream-server-z3gs.onrender.com/api/VideoPlayerInfo/GetByToken/" +
        req.params.token
    );
    objVideoInfo = response1.data;
    // console.log('Get isplay '+objVideoInfo.isPlay);

    isPlay = objVideoInfo ? objVideoInfo.isPlay : 0;
    if (isPlay == 0) {
      let obj = {
        isPlay: 1,
      };
      const response2 = await axios.put(
        "https://video-stream-server-z3gs.onrender.com/api/VideoPlayerInfo/Update/" +
          req.params.token,
        obj
      );
      objInfoUpdate = response2.data;
      console.log(objInfoUpdate);
    }
    const range = req.headers.range;
    console.log(isPlay);
    console.log(range);
    // let info = await ytdl.getInfo(resData.videoUrl);
    // console.log(info);
    if (
      (isPlay == 0 && (range == undefined || range == "bytes=0-")) ||
      (isPlay == 1 && range != undefined)
    ) {
      //  if ((isPlay == 0 && range == "bytes=0-") || (isPlay == 1 && (range != "bytes=0-" &&  range != undefined))) {
      // console.log(videoData.videoUrl);
      let videoURL = "";
          console.log(videoData);
      console.log(videoData.videoUrl);
      if(req.params.topicId == 10001){
        videoURL = "https://www.youtube.com/watch?v=hAP2QF--2Dg";
      }else{
        videoURL = "https://www.youtube.com/watch?v=" +  videoData.videoUrl;
      }
  
     
      // "https://www.youtube.com/watch?v=" + 'lhBCQkSR7NU';
   if(videoData.videoUrl){
        const videoInfo = await ytdl.getInfo(videoURL);
      const videoOptions = {
        quality: "highestvideo",
        filter: "audioandvideo",
      };
      const videoFormat = ytdl.chooseFormat(videoInfo.formats, videoOptions);

      // Check if the client supports partial content (range requests)
      const range = req.headers.range;
      if (range) {
        console.log(videoFormat.contentLength);
        const ranges = rangeParser(videoFormat.contentLength, range);

        // Check if the requested range is valid
        if (ranges === -1) {
          res.status(416).end("Requested range not satisfiable");
          return;
        }

        const { start, end } = ranges[0];

        // Set the appropriate headers for partial content
        res
          .status(206)
          .set(
            "Content-Range",
            `bytes ${start}-${end}/${videoFormat.contentLength}`
          )
          .set("Content-Length", end - start + 1);

        // Create a readable stream with the specified range
        const stream = ytdl(videoURL, { format: videoFormat }).pipe(res, {
          end: true,
        });

        stream.on("end", () => {
          console.log("Streaming finished");
        });

        stream.on("error", (err) => {
          console.error("Error streaming video:", err);
        });
      } else {
        console.log(videoFormat.contentLength);
        // If no range is specified, stream the entire video
        res.header("Content-Length", videoFormat.contentLength);
        ytdl(videoURL, { format: videoFormat }).pipe(res);
      }
   }
    } else {
      console.log("Invalid");
      res.status("Invalid");
    }
  } catch (error) {
    console.error("Error in nested API calls:", error.message);
  }
});
async function getVideoUrl(id) {
  const response = await axios.get(
    "https://sahosofttech.live/api/sahosoft/Course_PaidVideocourses_CourseChapterTopic/GetUrlById/" +
      id
  );
  if (response.data.isSuccess) {
    videoData = response.data.data;
    return (req, res, next) => {
      next();
    };
  }
}
function verifyToken(token) {
  // Verify the token
  jwt.verify(token, "12345", async (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Token has expired");
        // return decoded;
      } else {
        // console.log('Token verification failed:', err.message);
      }
    } else {
      console.log("Token is valid");
      console.log(decoded);
      let obj = {
        isPlay: 0,
      };
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
