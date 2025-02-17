/**
 * @deprecated This file is deprecated.
 *
 * The functionality provided here has been moved to socket.io.ts.
 *
 * Reason for deprecation:
 * Socket.io serves as a better alternative in the current use cases
 *
 * The file could be removed in the future.
 */

import WebSocket from "ws";
import { setupAzureSpeech, processAudioChunk} from "../services/azureSpeechService.js";
import sdk from 'microsoft-cognitiveservices-speech-sdk';

// Create the WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket connection established for audio stream.");

  const speechConfig = setupAzureSpeech();

  // Create a push stream for audio data
  const audioStream = sdk.AudioInputStream.createPushStream();

  // Configure audio input and recognizer
  const audioConfig = sdk.AudioConfig.fromStreamInput(audioStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  // Attach recognition events
  recognizer.recognizing = (s, e) => {
    console.log(`Recognizing: ${e.result.text}`);
    ws.send(JSON.stringify({ type: "recognizing", text: e.result.text }));
  };

  recognizer.recognized = (s, e) => {
    if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
      console.log(`Recognized: ${e.result.text}`);
      ws.send(JSON.stringify({ type: "recognized", text: e.result.text }));
    } else {
      console.log("No match or error occurred.");
    }
  };

  recognizer.canceled = (s, e) => {
    console.error(`Canceled: ${e.reason}`);
    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.sessionStopped = (s, e) => {
    console.log("Session stopped.");
    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.startContinuousRecognitionAsync();

  ws.on("message", (data) => {
    // Delegate audio processing to the service layer
    audioStream.write(data);
    console.log(data);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed.");
    audioStream.close(); // Close the Azure audio stream
    recognizer.stopContinuousRecognitionAsync(() => recognizer.close());
  });
});

export default wss;
