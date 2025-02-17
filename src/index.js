import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import config from "./config/envConfig.js";
import socketHandler from "./websockets/socketHandler.js";
import app from "./app.js";

// Load environment variables
dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  path: "/audio-stream",
  cors: {
    origin: "*",  // Allows all origins (or specify your client URL here)
    methods: ["GET", "POST"],
  },
  pingTimeout: 2 * 60 * 1000 // Wait for 2 mins
});

socketHandler(io); // Set up socket

server.listen(config.port, () => {
  console.log("Server is running on port", config.port);
});
