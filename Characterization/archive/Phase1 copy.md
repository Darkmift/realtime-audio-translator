### **MVP #1: Initial System Overview**

The primary goal of MVP #1 is to enable a **presenter** to stream live video and audio, and for clients (watchers) to receive and view the stream in real time. The focus is on establishing a reliable real-time video/audio streaming pipeline using WebRTC.

---

### **Components**:

1. **PresenterUI** (Speaking Client):
   - **Frontend**: A web interface where the presenter can start streaming video and audio.
   - **Features**:
     - Video input (using a webcam).
     - Audio input (using a microphone).
     - Start/Stop stream button.
   
2. **WatcherUI** (Listening Client):
   - **Frontend**: A web interface where clients (watchers) can join and view the live stream.
   - **Features**:
     - Receive and play the video/audio stream in real time.
     - Simple UI with a video player.

3. **Backend**:
   - **Signaling Server**: Used for negotiating the WebRTC connection between the presenter and watchers.
   - **Media Server** (Optional for scaling): A server to handle multiple clients by routing video/audio streams efficiently.
   - **Database** (Optional for future extensions): Store session information, connected clients, etc.

---

### **Technologies to Use**:

1. **WebRTC**:
   - WebRTC (Web Real-Time Communication) will be the core technology for handling peer-to-peer audio/video streaming between the presenter and watchers.
   - WebRTC can be directly implemented using the browser APIs, but we’ll need a **signaling server** for establishing connections.

2. **Frontend Technologies**:
   - **PresenterUI** and **WatcherUI**:
     - **React.js** (or **Vue.js**): For creating responsive UIs on both the Presenter and Watcher sides.
     - **WebRTC APIs**: Built directly into modern browsers to manage media streams.
     - **Socket.IO**: For real-time signaling between the presenter and watchers to exchange WebRTC session information (SDP, ICE candidates).

3. **Backend Technologies**:
   - **Node.js + Express**: To create the signaling server.
   - **Socket.IO**: For signaling and real-time communication between the clients and the server to initiate the WebRTC connection.
   - **Optional Media Server**:
     - Use a simple **media server** like **Janus**, **Kurento**, or **Jitsi** if you need to handle multiple watchers and optimize routing for scalability.
   - **Security**:
     - Use **HTTPS** for secure connections, as WebRTC requires it.
     - Optionally, you could implement **JWT tokens** for session authentication, especially if you’ll extend the system later.

---

### **Detailed Steps**:

#### **1. Signaling Server (Node.js + Socket.IO)**:
   - The signaling server is essential for establishing peer-to-peer WebRTC connections.
   - The process involves exchanging **SDP** (Session Description Protocol) messages and **ICE candidates** between the presenter and the watchers.
   
   **Key Tasks**:
   - Set up a **Node.js** server with **Socket.IO** to handle the signaling.
   - Implement socket events for connecting peers, sharing ICE candidates, and relaying SDP offers/answers.

   **Example Code (Signaling)**:
   ```javascript
   const express = require('express');
   const http = require('http');
   const socketIo = require('socket.io');

   const app = express();
   const server = http.createServer(app);
   const io = socketIo(server);

   io.on('connection', (socket) => {
     console.log('User connected');

     // Forward SDP offer from presenter to watchers
     socket.on('offer', (offer) => {
       socket.broadcast.emit('offer', offer);
     });

     // Forward SDP answer from watcher to presenter
     socket.on('answer', (answer) => {
       socket.broadcast.emit('answer', answer);
     });

     // Forward ICE candidates
     socket.on('ice-candidate', (candidate) => {
       socket.broadcast.emit('ice-candidate', candidate);
     });
   });

   server.listen(3000, () => {
     console.log('Signaling server is running on port 3000');
   });
   ```

#### **2. PresenterUI (React.js + WebRTC)**:
   - Implement video and audio capture using WebRTC's `getUserMedia` API to access the presenter's webcam and microphone.
   - Create a WebRTC connection to the signaling server and send the media stream to the connected watchers.

   **Key Tasks**:
   - Capture the presenter's media stream using WebRTC.
   - Send the stream to the signaling server via **Socket.IO**.
   - Establish the peer connection between presenter and watchers.

   **Example Code (Presenter)**:
   ```javascript
   const startStreaming = async () => {
     const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
     const peerConnection = new RTCPeerConnection();

     // Add local stream to peer connection
     stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

     // Handle ICE candidates
     peerConnection.onicecandidate = (event) => {
       if (event.candidate) {
         socket.emit('ice-candidate', event.candidate);
       }
     };

     // Create and send the SDP offer
     const offer = await peerConnection.createOffer();
     await peerConnection.setLocalDescription(offer);
     socket.emit('offer', offer);
   };
   ```

#### **3. WatcherUI (React.js + WebRTC)**:
   - Set up the UI to receive the media stream from the presenter and play it using an HTML5 `<video>` element.
   - The watcher listens for the presenter's WebRTC offer, responds with an SDP answer, and handles the incoming media stream.

   **Key Tasks**:
   - Listen for the presenter's WebRTC offer and create an SDP answer.
   - Display the received media stream in the UI.

   **Example Code (Watcher)**:
   ```javascript
   const startWatching = () => {
     const peerConnection = new RTCPeerConnection();

     // Handle incoming stream
     peerConnection.ontrack = (event) => {
       const [stream] = event.streams;
       document.getElementById('video').srcObject = stream;
     };

     // Handle ICE candidates
     peerConnection.onicecandidate = (event) => {
       if (event.candidate) {
         socket.emit('ice-candidate', event.candidate);
       }
     };

     // Listen for SDP offer from presenter
     socket.on('offer', async (offer) => {
       await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
       const answer = await peerConnection.createAnswer();
       await peerConnection.setLocalDescription(answer);
       socket.emit('answer', answer);
     });
   };
   ```

---

## Not part of phase but future consideration post phase 3

### **Deployment and Testing**:
- **Local Development**: You can test MVP #1 on localhost, but you'll need an SSL certificate (e.g., via **Let's Encrypt**) because WebRTC requires HTTPS connections for most browsers.
- **Production**: Consider deploying the signaling server using **Heroku**, **Google Cloud**, or **AWS**. You could also deploy your WebRTC media server on a cloud service, depending on scalability needs.

### **Scaling Considerations**:
- For a small number of watchers, direct peer-to-peer WebRTC may suffice. As the number of viewers increases, a media server like **Janus** or **Kurento** can be used to relay streams more efficiently.