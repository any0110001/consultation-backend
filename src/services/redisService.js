import redis from "../config/redis.js";
import {LockedMap} from "../utils/lockedMap.js";

const sessionKey = (sessionId) => {
  return `session:${sessionId}`;
}

const bufferQueueKey = (sessionId) => {
  return `session:${sessionId}:bufferQueue`;
}

const transcriptionKey = (sessionId) => {
  return `session:${sessionId}:transcription`;
}

const infoKey = (sessionId) => {
  return `session:${sessionId}:info`;
}

const noteKey = (sessionId) => {
  return `session:${sessionId}:note`;
}

/**
 * Clear the session information in redis. This function should be called after
 * all information gets stored in database.
 *
 * @param sessionId
 */
export const clearRedisSession = async (sessionId) => {
  await redis.del(
    sessionKey(sessionId),
    infoKey(sessionId),
    transcriptionKey(sessionId),
    noteKey(sessionId),
    bufferQueueKey(sessionId));
}

/**
 * Start a session with keys initialised and TTLs set
 *
 * @param sessionId
 */
export const startRedisSession = async (sessionId) => {
  // Store session metadata in Redis
  redis.hset(sessionKey(sessionId), {
    status: "active",
    startTime: new Date().toISOString(),
  }, (err, response)=>{
    if(err) {
      console.error("Error setting key:", err);
    } else {
      console.log("Key set successfully:", response);
      redis.expire(sessionKey(sessionId), 12*60*60, (expireErr, expireResponse) => {
        if (err) {
          console.error("Error setting TTL:", expireErr);
        } else {
          console.log("TTL set successfully:", expireResponse);
        }
      });
    }
  });

  redis.set(transcriptionKey(sessionId), "", (err, response) => {
    if (err) {
      console.error("Error setting key:", err);
    } else {
      console.log("Key set successfully:", response);

      // Then set the TTL for this key
      redis.expire(transcriptionKey(sessionId), 12*60*60, (expireErr, expireResponse) => {
        if (expireErr) {
          console.error("Error setting TTL:", expireErr);
        } else {
          console.log("TTL set successfully:", expireResponse);
        }
      });
    }
  });

  redis.set(noteKey(sessionId), "", (err, response) => {
    if (err) {
      console.error("Error setting key:", err);
    } else {
      console.log("Key set successfully:", response);

      // Then set the TTL for this key
      redis.expire(noteKey(sessionId), 12*60*60, (expireErr, expireResponse) => {
        if (expireErr) {
          console.error("Error setting TTL:", expireErr);
        } else {
          console.log("TTL set successfully:", expireResponse);
        }
      });
    }
  });
}

/**
 * This function is used to add consultation transcript to Redis
 *
 * @param sessionId
 * @param bufferId
 * @param transcription
 */
export const appendTranscription = async (sessionId, bufferId, transcription) => {
  redis.append(transcriptionKey(sessionId), transcription, (err, response) => {
    if (err) {
      console.error('Error appending transcription to Redis:', err);
    } else {
      console.log('Appended transcription to Redis, current length:', response);
    }
  });
  redis.hset(sessionKey(sessionId), "lastReceivedBuffer", bufferId);
}

/**
 * This function is used to add patients information to Redis
 *
 * @param sessionId
 * @param info
 */
export const addInfoRedis = async (sessionId, info) => {
  redis.hset(infoKey(sessionId), info, (err, response)=>{
    if(err) {
      console.error("Error setting key:", err);
    } else {
      console.log("Key set successfully:", response);
      redis.expire(infoKey(sessionId), 12*60*60, (expireErr, expireResponse) => {
        if (err) {
          console.error("Error setting TTL:", expireErr);
        } else {
          console.log("TTL set successfully:", expireResponse);
        }
      });
    }
  });
}

/**
 * This function is used to add notes to Redis
 *
 * @param sessionId
 * @param note
 */
export const addNoteRedis = async (sessionId, note) => {
  redis.append(noteKey(sessionId), note, (err, response) => {
    if (err) {
      console.error('Error appending note to Redis:', err);
    } else {
      console.log('Appended note to Redis, current length:', response);
    }
  })
}

/**
 * The function is to get the result when a consultation session finishes
 *
 * @param sessionId
 * @returns a result block
 */
export const getResult = async (sessionId) => {
  const info = await redis.hgetall(infoKey(sessionId));
  const transcription = await redis.get(transcriptionKey(sessionId));
  const note = await redis.get(noteKey(sessionId));

  return {
    info,
    note,
    transcription
  };
}

/**
 * This is the function called when server crashed and reboots. It helps recover the clients' states
 * before resuming sessions. For now, the only state needs to be recovered is the lastReceivedBuffer,
 * which is used for acknowledgement to the client side. It was also implemented to recover the
 * bufferQueue, which was later found not necessary and quite time-consuming (due to Redis round-trips).
 *
 * @param clientStateMap to be updated in this function
 */
export const recoverClientStateFromRedis = async (clientStateMap) => {
  try {
    const keys = await redis.keys("session:*");

    if (keys.length > 0) {
      // Use a Set to ensure unique session IDs
      const sessionIds = new Set();

      // Prepare to fetch values only for unique session keys
      keys.forEach((key) => {
        const sessionId = key.split(":")[1];  // Extract base session ID (before any ':')
        sessionIds.add(sessionId);
      });

      const pipeline = redis.pipeline(); // Utilise pipeline for higher performance

      // Retrieve `expectedBufferId` and prepare to fetch the list for each key
      sessionIds.forEach((sessionId) => {
        pipeline.hget(sessionKey(sessionId), "lastReceivedBuffer");
        // pipeline.lrange(`${key}:bufferQueue`, 0, -1); // Get the entire list of bufferQueue
      });

      const results = await pipeline.exec(); // Execute all commands in one go

      // Process the results for each session
      let resultIndex = 0;
      sessionIds.forEach((sessionId) => {
        // Extract lastReceivedBufferId, if it does not exist, set to -1 (so expecting bufferId 0)
        const lastReceivedBufferId = results[resultIndex][1] ? Number(results[resultIndex][1]) : -1;
        const expectedBufferId = lastReceivedBufferId + 1;
        const bufferQueue = new LockedMap(); // Initialize a new empty Map for bufferQueue
        // const bufferQueue = new Map(
        //   bufferQueueList.map((buffer) => {
        //     const parsedBuffer = JSON.parse(buffer);
        //     return [parsedBuffer.bufferId, parsedBuffer];
        //   })
        // );

        // Store the state in clientStateMap for each sessionId
        clientStateMap.set(sessionId, {
          expectedBufferId,
          bufferQueue,
        });
        resultIndex++;
      });
    }
    console.log("Client state recovery completed successfully.");
  } catch (err) {
    console.error("Error recovering client state from Redis:", err);
    throw err;
  }
};

/**
 * Starting from this point, the functions below were implemented but not used because there
 * are better alternative found specifically for the current use cases. But they can still be
 * preserved for any future requirement of synchronisation.
 */
let syncInterval;

export const syncClientStateToRedis = async (clientStateMap) => {
  try {
    for (const [sessionId, state] of clientStateMap) {
      const redisBufferQueueKey = bufferQueueKey(sessionId);

      // Start a Redis pipeline for batch operations
      const pipeline = redis.pipeline();

      // Clear existing bufferQueue and add updated buffers
      if (state.bufferQueue && state.bufferQueue.size > 0) {
        pipeline.del(redisBufferQueueKey); // Clear existing queue
        for (const [, buffer] of state.bufferQueue) {
          pipeline.rpush(redisBufferQueueKey, JSON.stringify(buffer)); // Add buffer
        }
      }

      // Set TTL for both keys
      pipeline.expire(redisBufferQueueKey, 12 * 60 * 60); // 12 hours

      // Execute the pipeline
      await pipeline.exec();
    }
    console.log("Synced client state to Redis successfully.");
  } catch (err) {
    console.error("Error syncing client state to Redis:", err);
  }
};

export const startPeriodicSyncToRedis = (clientStateMap) => {
  // Clear any existing interval to avoid duplicates
  if (syncInterval) clearInterval(syncInterval);

  // Set up a 1-minute interval for synchronization
  syncInterval = setInterval(async () => {
    try {
      console.log("Starting periodic synchronization...");
      await syncClientStateToRedis(clientStateMap);
    } catch (err) {
      console.error("Error during periodic synchronization:", err);
    }
  }, 60 * 1000); // 60 seconds
};

export const stopPeriodicSyncToRedis = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("Stopped periodic synchronization.");
  }
};

// handle process termination to clean up the interval
process.on("SIGINT", () => {
  stopPeriodicSyncToRedis();
  process.exit();
});


