## **MVP #1: Initial System Overview**

The primary goal of MVP #1 is to enable a **presenter** to stream live video and audio, and for clients (watchers) to receive and view the stream in real time. The core focus is on establishing a reliable real-time video/audio streaming pipeline using WebRTC, with a clear distinction between the frontend UI and backend services required.

---

### **Business Logic**

#### **1. PresenterUI (Speaking Client)**

The **PresenterUI** allows the presenter to initiate a live video and audio stream. This interface handles the real-time capturing of the presenter's media (webcam and microphone) and passes it to the signaling server for distribution to connected watchers.

##### **UI Business Logic**:
- **Video and Audio Input**: The presenter can initiate and stop media streaming by selecting their webcam and microphone as input sources. This will be done using WebRTC’s `getUserMedia` API.
- **Start/Stop Streaming**: The presenter can start or stop the stream with the click of a button. When streaming starts, the UI will capture the presenter's media and initiate the WebRTC connection.
- **Network Status**: The PresenterUI should display the connection status, indicating if the stream is live, offline, or facing any connectivity issues.
- **Peer Connection Setup**: Presenter’s UI interacts with the backend to set up a WebRTC peer connection and send an SDP offer. The connection details are sent via the signaling server.

##### **Key Considerations**:
- **User Feedback**: The UI must be responsive, showing the presenter whether their stream is active, paused, or stopped.
- **Media Controls**: Presenters should have control over their video/audio input devices and the ability to toggle them on/off during the stream.

---

#### **2. WatcherUI (Listening Client)**

The **WatcherUI** allows viewers (watchers) to connect to the presenter's stream in real time. It should provide an intuitive video player for watching the stream.

##### **UI Business Logic**:
- **Join Live Stream**: Watchers will be able to join the presenter’s live stream session. Upon connection, the UI will establish a peer-to-peer WebRTC connection and start receiving the video/audio stream.
- **Display Video/Audio**: The received media is played in a simple video player that adapts to different devices and screen sizes.
- **Real-Time Playback**: The stream is displayed with minimal latency, and the UI should handle any buffering or connection issues gracefully.
- **Dynamic Interaction**: If scaling is a concern, the WatcherUI may also receive updates from the backend on stream availability or quality adjustments (e.g., switching to a lower-quality stream based on network conditions).

##### **Key Considerations**:
- **Buffering & Latency**: Minimizing latency is crucial to maintaining a seamless viewer experience. If necessary, implement adaptive playback to adjust based on network quality.
- **Join and Leave Events**: The UI should handle watchers dynamically joining or leaving the stream, without disrupting the experience for others.

---

#### **3. Backend Business Logic (Signaling Server)**

The **Backend** is responsible for managing communication between the presenter and watchers. It facilitates the WebRTC connection by relaying necessary metadata (like SDP offers and answers) and ICE candidates through the signaling server.

##### **Backend Business Logic**:
- **Signaling Server**: The backend acts as a WebRTC signaling server. It handles:
  - **SDP Exchange**: The signaling server relays the SDP offers from the presenter and the SDP answers from watchers.
  - **ICE Candidate Exchange**: The server manages the exchange of ICE candidates between the presenter and watchers to establish a connection.
- **Connection Management**: The server tracks which watchers are connected to which presenter and manages the lifecycle of these connections (e.g., handling disconnections or reconnections).
- **Optional Media Server**: If the system needs to scale for many viewers, a media server (like Janus or Kurento) can be introduced to relay streams from the presenter to multiple watchers, reducing the load on the presenter’s machine and improving scalability.
  
##### **Key Considerations**:
- **Scalability**: In early stages, peer-to-peer connections might be sufficient for a small number of watchers. As the number of watchers grows, the system may need to introduce a media server to relay streams more efficiently.
- **Security**: All communication between the presenter and watchers should be encrypted via HTTPS and WebRTC’s built-in security protocols. If needed, authentication mechanisms like **JWT** can be introduced to ensure only authorized clients can join the stream.

---

### **Technologies to Use**

- **WebRTC**: Handles real-time peer-to-peer video/audio streaming.
- **Socket.IO**: Used for signaling between the presenter, watchers, and backend server.
- **React.js**: Frontend framework for building responsive UIs for both PresenterUI and WatcherUI.
- **Node.js + Express**: Backend framework to create the signaling server.
- **STUN/TURN Servers**: Required for NAT traversal and ensuring peers can connect behind different network configurations. Use a STUN server for direct peer-to-peer communication and a TURN server for relaying media when direct connections fail.