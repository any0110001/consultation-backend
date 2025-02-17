/**
 * This file can be ignored. Due to time constraints, the integration with Azure Speech
 * was not completed. Important information was found that, Azure Speech only supports
 * WAV format while Recorders record WEBM format from the client side
 */

import config from "../config/envConfig.js";
import sdk from 'microsoft-cognitiveservices-speech-sdk';

/**
 * Function to set up Azure Speech configuration
 * @return SpeechConfig
 */
export const setupAzureSpeech = () => {
  const speechConfig = sdk.SpeechConfig.fromSubscription(config.azure.key, config.azure.region);
  speechConfig.speechRecognitionLanguage = 'en-US';
  return speechConfig;
};

/**
 * Dummy function to run speech recognition
 * @param speechConfig
 * @param audio
 * @returns {string}
 */
// Function to process the audio chunk and send it to Azure
export const processAudioChunk = (speechConfig, audio) => {
  // // Create a push stream for sending audio chunks to Azure
  // const audioStream = sdk.AudioInputStream.createPushStream();
  // audioStream.write(audio) // Write the incoming chunk to the audio stream
  // // Close the stream after writing all chunks
  // audioStream.close();
  //
  // // Create an audio configuration using the push stream
  // const audioConfigStream = sdk.AudioConfig.fromStreamInput(audioStream);
  //
  // // Create a recognizer using the Azure configuration
  // const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfigStream);
  //
  //
  // recognizer.recognizing = (s, e) => {
  //   console.log(`RECOGNIZING: Text=${e.result.text}`);
  // };
  //
  // recognizer.recognized = (s, e) => {
  //   if (e.result.reason == sdk.ResultReason.RecognizedSpeech) {
  //     console.log(`RECOGNIZED: Text=${e.result.text}`);
  //   }
  //   else if (e.result.reason == sdk.ResultReason.NoMatch) {
  //     console.log("NOMATCH: Speech could not be recognized.");
  //   }
  // };
  //
  // recognizer.canceled = (s, e) => {
  //   console.log(`CANCELED: Reason=${e.reason}`);
  //
  //   if (e.reason == sdk.CancellationReason.Error) {
  //     console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
  //     console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
  //     console.log("CANCELED: Did you set the speech resource key and region values?");
  //   }
  //
  //   recognizer.stopContinuousRecognitionAsync();
  // };
  //
  // recognizer.sessionStopped = (s, e) => {
  //   console.log("\n    Session stopped event.");
  //   recognizer.stopContinuousRecognitionAsync();
  // };
  //
  // recognizer.startContinuousRecognitionAsync();

  return "A chunk of dummy transcription\n";
};
