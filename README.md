# Simplified Lyrebird Consultation Application

A simplified lyrebird consultation transcribing application showcasing my ability in software development. It ensures reliable, concurrent data transmission and handles various edge cases for smooth performance.

---

## Table of Contents

1. [Setup and Run Locally](#setup-and-run-locally)
2. [Key Features](#key-features)
3. [Assumptions](#assumptions)
4. [Considerations](#considerations)
5. [Future Implementations](#future-implementations)

---

## Setup and Run Locally

1. **Prerequisites**:
    - Use **npm version 10.9.0** or compatible.
    - Docker is not used to simplify setup.
2. **Steps to Run**:
    - Unzip the project
    - Open the first terminal and navigate to the consultation-transcribing/backend directory
    - Run the following command in the terminal:
      `npm install && npm run start` 
    - Then open another terminal and navigate to the consultation-transcribing/frontend directory
    - Run the following command in the terminal:
      `npm install && npm run build && npm run start`
	- The application will be accessible at `http://localhost:3000`:
		- Frontend: **Port 3000**
		- Backend: **Port 3001** (ensure port availability)

---

## Key Features (brief explanations)

1. **Real-Time Data Transmission**:
    - Utilises **socket.io** for continuous, low-latency communication between frontend and backend.
2. **BufferQueue Mechanism**:
    - Implements a sliding window protocol in both frontend and backend for:
        - Ensuring data order and reliability.
        - Handling retries for unacknowledged chunks during errors or reconnections.
3. **Concurrency Management**:
    - Effectively handles high-concurrency scenarios with Mutex locks for session-specific operations.
4. **Resilience**:
    - Automatically resumes sessions after backend crashes, maintaining data consistency and session integrity.
5. **Scalability Potential**:
    - Successfully tested with **11 simultaneous sessions**, handling reconnections after a 20-second backend downtime. (This is not related to the upper bound)

---

================================================================
Below are some detailed information we might be discussing during the interview session. So they can be ignored :)
## Assumptions

1. **Audio Storage**:
    - Only transcripts are stored to reduce storage costs. Audio storage could be added if required for validation purposes.
2. **Session Duration**:
    - Average consultation session length is assumed to be **45 minutes**, influencing socket.io configuration for retries and reconnections.
3. **LLM Integration**:
    - Simulated with dummy functions for streamlined processing and storage.

---

## Considerations

### Resolved Edge Cases:

1. **Data Transmission Overhead**:
    - Optimised buffer size (**128 KB**) sends audio chunks around every 5 seconds, reducing overhead.
2. **Session Management**:
    - Sessions persist across backend crashes using session initialisation communication.
3. **Final Chunk Handling**:
    - Ensures the last chunk is transmitted using `onstop` event of MediaRecorder.
4. **Duplicate Start Listening Clicks**:
    - Introduced a 0.5-second click disable to prevent duplicate triggers.
5. **Concurrency in Backend**:
    - Uses `clientStateMap` to manage session-specific variables safely.
6. **Retries on Reconnection**:
    - Implements queue-based sliding window protocol to handle high-volume retries.
7. **Redis Key Management**:
    - Sets TTL for Redis keys to prevent garbage data from lingering indefinitely.
8. **Ghost Data Checks**:
    - Ensures no unexpected or invalid data is processed.

### General Considerations:

1. **Logging**:
    - `console.log` statements preserved for demonstration purposes.
2. **Deployment**:
    - Frontend and backend should be deployed separately.
    - Use a load balancer (e.g., Azure) for high-user volume and multiple backend instances.
3. **Monitoring**:
    - Tools like Azure Monitor should be used for real-time error tracking and alerts in production.
4. **Scalability**:
	+ Tools like RabbitMQ,  Kafka can be useful for large scale applications.

---

## Future Implementations

### Planned Features (due to time constraints):

1. **Speech Recognition Integration**:
    - Add transcription capabilities using external APIs or libraries.
2. **Database Support**:
    - Introduce persistent storage for session data.
3. **User Authentication**:
    - Implement secure login and user management.
4. **Automated Testing**:
    - Write test cases for unit and integration testing during production.
5. **SSL configuration**

### Unresolved Edge Cases:

1. **Session Across Devices**:
    - Handling users signing in from multiple devices using the same account.
2. **Browser Closure**:
    - Preserve session state with localStorage or indexedDB for accidental closures or reloading.
3. **Noise Filtering**:
    - Explore noise suppression techniques for improved transcription accuracy.
4. **Long Consultations**:
    - Address interruptions like laptop sleep mode during lengthy sessions.
5. **Microphone State**:
    - Resolve discrepancies where the browser shows the microphone is active after pausing.
6. **Client Logging**:
    - Separate logging for each session or client for better debugging.