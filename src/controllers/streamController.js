import { v4 } from "uuid";
import {
  startRedisSession, appendTranscription,
  addNoteRedis, addInfoRedis, clearRedisSession,
  getResult, recoverClientStateFromRedis
} from "../services/redisService.js";
import { setupAzureSpeech, processAudioChunk } from "../services/azureSpeechService.js";
import {generateSummary} from "../services/aiService.js";
import {LockedMap} from "../utils/lockedMap.js";

const azureSpeechConfig = null; // = setupAzureSpeech();

const clientStateMap = new Map();
await recoverClientStateFromRedis(clientStateMap); // The server will recover client states before running

/**
 * Controller to control the initialisation of sessions
 *
 * @returns sessionId
 */
export const startSession = async () => {
  const sessionId = v4();
  await startRedisSession(sessionId);
  clientStateMap.set(sessionId, {expectedBufferId: 0, bufferQueue: new LockedMap()})
  // startPeriodicSyncToRedis(clientStateMap);
  console.log(`Session started with sessionId: ${sessionId}`);
  return sessionId;
};

/**
 * Controller to control resuming of sessions, notifying client side of the expectedBufferId
 *
 * @param sessionId
 * @returns expectedBufferId
 */
export const resumeSession = async (sessionId) => {
  let clientState;
  if(clientStateMap.has(sessionId)) {
    clientState = clientStateMap.get(sessionId);
  } else{ // Handle the case that the session crashed at the very beginning, before the info gets stored in Redis
    clientStateMap.set(sessionId, {expectedBufferId: 0, bufferQueue: new LockedMap()});
    clientState = clientStateMap.get(sessionId);
  }
  // startPeriodicSyncToRedis(clientStateMap);
  console.log(`Session resumed with sessionId: ${sessionId}`);
  console.log("ExpectedBufferId: ", clientState.expectedBufferId);
  return clientState.expectedBufferId;
}

/**
 * Controller to streamData, this utilises a bufferQueue to ensure the order of the
 * buffer chunks and also achieved deduplication.
 *
 * @param socket
 * @param data
 * @returns expecteBufferId
 */
export const streamData = async (socket, data) => {
  const clientState = clientStateMap.get(data.sessionId);
  if(!clientState) {
    console.error(`Ah? Who are you, ${data.sessionId}`);
    return -1;
  }
  // Only one thread can work with the bufferQueue at a time
  const release = await clientState.bufferQueue.lock(data.bufferId);
  try {
    if(data.bufferId < clientState.expectedBufferId) return clientState.expectedBufferId;
    // Store the chunk in the queue
    await clientState.bufferQueue.set(data.bufferId, data);

    // Process chunks in order
    while (await clientState.bufferQueue.has(clientState.expectedBufferId)) {
      const nextBuffer = await clientState.bufferQueue.get(clientState.expectedBufferId);
      // Added chunk number for chunks to show that the result is in correct order
      await appendTranscription(nextBuffer.sessionId, nextBuffer.bufferId, `${data.sessionId.split("-")[0]}: Chunk ${nextBuffer.bufferId}: ${processAudioChunk(azureSpeechConfig, nextBuffer.audio)}`);
      console.log(`Data cached with sessionId: ${data.sessionId}`);
      await clientState.bufferQueue.delete(clientState.expectedBufferId);
      clientState.expectedBufferId++;
    }
    console.log("ExpectedBufferId: ", clientState.expectedBufferId);
    return clientState.expectedBufferId;
  } catch (err) {
    console.error("Error caching data:", err);
  } finally {
    release();
  }
  return clientState.expectedBufferId;
}

/**
 * Controller to control adding information
 *
 * @param socket
 * @param data
 */
export const addInfo = async (socket, data) => {
  try {
    const info = { ...data };
    // Remove sessionId from the data to store, preserve extensibility for more information that could be added
    delete info.sessionId;

    await addInfoRedis(data.sessionId, info);
    console.log(`Info cached with sessionId: ${data.sessionId}`);
  } catch (err) {
    console.error("Error caching info:", err);
  }
}

/**
 * Controller to control adding note
 *
 * @param socket
 * @param data
 */
export const addNote = async (socket, data) => {
  try {
    await addNoteRedis(data.sessionId, data.note);
    console.log(`Note cached with sessionId: ${data.sessionId}`);
  } catch (err) {
    console.error("Error caching note:", err);
  }
}

/**
 * Controller to get and return the result. Due to time constraints, database
 * is not involved in the current version.
 *
 * @param socket
 * @param sessionId
 * @returns result
 */
export const endSession = async (socket, sessionId) => {
  try {
    const result = await getResult(sessionId);
    const summary = generateSummary(result);
    // Save session data to DB
    // await saveSessionDataToDb(sessionId, sessionMetadata, sessionBuffers);

    clientStateMap.delete(sessionId);
    // if (clientStateMap.size === 0) stopPeriodicSyncToRedis();
    // Clean up Redis
    await clearRedisSession(sessionId);
    return {summary, transcription: result.transcription}
  } catch (err) {
    console.error(`Error ending session ${sessionId}:`, err);
  }
};
