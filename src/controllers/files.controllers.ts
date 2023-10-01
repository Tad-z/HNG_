import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
// import { Writable } from "stream";
// import { log } from "console";

// let isFileReady = false;

const getFormattedDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  const formattedDate = `${year}${month}${day}`;
  return formattedDate;
};

// Define a directory for storing video chunks
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Define an array to store received chunks
const chunkArray: string[] = [];


export const receiveVideoChunk = (req: Request, res: Response): void => {
  try {
    // Extract base64 data from the request body
    const base64Data: string = req.body.base64Data;
    console.log("base64Data:", base64Data);
    

    // Push the base64 data to the array
    chunkArray.push(base64Data);
    console.log("chunkArray:", chunkArray);
    

    // Send a response indicating success
    res.json({ message: 'Data received successfully' });
    console.log("Data received successfully");
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to serve the merged video file
export const serveMergedVideo = (req: Request, res: Response): void => {
  try {
    if (chunkArray.length === 0) {
      res.status(400).json({ message: 'No data received' });
      return;
    }

    // Merge all base64 chunks into a single string
    const mergedBase64: string = chunkArray.join('');

    // Convert the merged base64 data to binary
    const mergedBuffer: Buffer = Buffer.from(mergedBase64, 'base64');

    // Save the merged binary data as a video file
    const formattedDate: string = getFormattedDate();
    const fileName: string = `MergedVideo_${formattedDate}.mp4`;
    const filePath: string = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, mergedBuffer);

    // Serve the merged video file
    res.sendFile(filePath);

    // Clear the chunk array for future requests
    chunkArray.length = 0;
  } catch (error) {
    console.error('Error serving merged video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// // Global variables to track file creation, data appending, and file readiness
// let fileStream: fs.WriteStream | null = null;
// let isFileReady = false;
// const videoChunks: Buffer[] = [];

// // Function to create a file
// export const createFile = async (req: Request, res: Response) => {
//   try {
//     // Define the directory where the file will be created
//     const date = new Date();

//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, "0");
//     const day = date.getDate().toString().padStart(2, "0");

//     const formattedDate = `${year}${month}${day}`;

//     const uploadDir = path.join(__dirname, "..", "uploads");
//     const fileName = `Untitled_Video_${formattedDate}.mp4`;
//     const filePath = path.join(uploadDir, fileName);

//     // Create a writable stream for the file
//     fileStream = fs.createWriteStream(filePath);

//     res.status(200).json({
//       message: "File creation initiated",
//       fileName,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // Function to receive data in chunks and append it to the file
// export const receiveDataAndAppend = (req: Request, res: Response) => {
//   try {
//     if (!fileStream) {
//       return res.status(400).json({ message: "File creation not initiated" });
//     }

//     const writableStream = new Writable({
//       write(chunk, encoding, callback) {
//         // Append the incoming data chunk to the file
//         fileStream?.write(chunk, encoding);
//         videoChunks.push(chunk); // Accumulate chunks for later assembly
//         callback();
//       },
//     });

//     // Pipe the request stream to the writable stream
//     req.pipe(writableStream);
//     console.log(writableStream);

//     res.status(200).json({ message: "Data chunk received and saved" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // Function to mark the file as ready
// export const finishFile = (req: Request, res: Response) => {
//   try {
//     if (!fileStream) {
//       return res.status(400).json({ message: "File creation not initiated" });
//     }

//     // Close the file stream to indicate that the file is ready
//     fileStream.end();
//     fileStream = null;
//     isFileReady = true;

//     res.status(200).json({ message: "File creation completed" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// Controller to serve the assembled video
// export const serveAssembledVideo = async (req: Request, res: Response) => {
//   try {
//     if (!isFileReady) {
//       return res.status(400).json({ message: "File is not ready yet" });
//     }

//     // Assemble the video chunks into a single video
//     const assembledVideo = Buffer.concat(videoChunks);

//     // Serve the assembled video with the appropriate headers
//     res.setHeader("Content-Type", "video/mp4");
//     res.setHeader("Content-Length", assembledVideo.length);
//     res.status(200).end(assembledVideo);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const fileUpload = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    console.log(req.file);

    res.status(200).json({
      message: "File uploaded successfully",
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(500).send({
          message: "File size cannot be larger than 200MB!",
        });
      }
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const fileDownload = (req: Request, res: Response) => {
  try {
    const name = req.params.fileName;

    const filePath = path.join(__dirname, "..", "uploads", name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, name);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const streamVideoFiles = async (req: Request, res: Response) => {
  try {
    const name = req.params.videoName;
    console.log({ name });

    const filePath = path.join(__dirname, "..", "uploads", name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    const stat = fs.statSync(filePath);
    console.log({ stat });
    const fileSize = stat.size;
    console.log({ fileSize });

    const range = req.headers.range;
    console.log({ range });

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      console.log({ parts });
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = end - start + 1;
      console.log({ chunksize });
      const file = fs.createReadStream(filePath, { start, end });
      console.log({ file });

      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, head);
      file.pipe(res);

      file.on("error", (err) => {
        console.error("Error streaming video:", err);
        res.status(500).json({ message: "Internal server error" });
      });

      // Log successful streaming
      file.on("end", () => {
        console.log("Video stream ended successfully.");
      });
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
