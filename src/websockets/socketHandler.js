import {
  startSession,
  streamData,
  addInfo,
  endSession,
  addNote,
  resumeSession
} from "../controllers/streamController.js";

/**
 * Handles Socket.IO events and logic.
 * @param {SocketIO.Server} io - The Socket.IO server instance.
 */
const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("initialise", async (callback) => {
      const sessionId = await startSession();
      callback(sessionId);
    })

    socket.on("resume-session", async (sessionId, callback) => {
      const expectedBufferId = await resumeSession(sessionId);
      callback(expectedBufferId);
    })

    socket.on("patient-info", (data) => {
      console.log("Patient information:" + JSON.stringify(data));
      addInfo(socket, data);
    })

    socket.on("note", (data) => {
      console.log("Note: " + JSON.stringify(data));
      addNote(socket, data);
    })

    socket.on("audio-chunk", async (data, callback) => {
      console.log("Received audio chunk:", data);
      const expectedBufferId = await streamData(socket, data);
      if(expectedBufferId === -1){
        callback({ status: "error"});
      }else {
        callback({status: "ack", bufferId: expectedBufferId});
      }
    });

    socket.on("end", async (sessionId, callback) => {
      const result = await endSession(socket, sessionId);
      console.log(result);
      callback(result);
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export default socketHandler;
