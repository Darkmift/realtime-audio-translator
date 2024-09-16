import { Server } from "socket.io";
import * as http from "http";
import { OpenViduRole, Session } from 'openvidu-node-client';
import { openvidu } from "../server";

const initSocket = (server: http.Server) => {

  const io = new Server(server);

  let broadcaster: any;
  let session: Session | null = null;  // Store the session so it can be reused

  io.sockets.on("error", e => console.log(e));
  io.sockets.on("connection", socket => {

    // Broadcaster connects
    socket.on("broadcaster", async () => {
      broadcaster = socket.id;
      socket.broadcast.emit("broadcaster");

      try {
        // Check if the session already exists, if not create a new one
        if (!session) {
          session = await openvidu.createSession();
        }

        // Create a connection for the broadcaster (publisher role)
        const connection = await session.createConnection({
          role: OpenViduRole.PUBLISHER,
        });
        const token = connection.token;

        console.log(`Session created and token generated for broadcaster: ${token}`);

        // Send the token to the broadcaster (you can use this in the frontend to connect the broadcaster to OpenVidu)
        socket.emit("broadcasterToken", token);

      } catch (error) {
        console.error("Error creating session", error);
      }
    });

    // Watcher connects
    socket.on("watcher", async () => {
      try {
        // Ensure that the session exists (created by the broadcaster)
        if (!session) {
          console.error("No session exists for the watcher to join.");
          return;
        }

        // Create a connection for the watcher (subscriber role)
        const connection = await session.createConnection({
          role: OpenViduRole.SUBSCRIBER,
        });
        const token = connection.token;

        console.log(`Token generated for watcher: ${token}`);

        // Send token back to the watcher
        socket.emit("watcherToken", token);

      } catch (error) {
        console.error("Error generating token for watcher", error);
      }
    });

    socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message);
    });

    socket.on("answer", (id, message) => {
      socket.to(id).emit("answer", socket.id, message);
    });

    socket.on("candidate", (id, message) => {
      socket.to(id).emit("candidate", socket.id, message);
    });

    socket.on("disconnect", () => {
      socket.to(broadcaster).emit("disconnectPeer", socket.id);
    });

  });
};

export default initSocket;
