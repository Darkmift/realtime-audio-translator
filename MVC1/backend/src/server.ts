import express from 'express';
import http from 'http';
import cors from 'cors';
import { OpenVidu, OpenViduRole, Session } from 'openvidu-node-client';

const OPENVIDU_URL = process.env.OPENVIDU_URL || 'http://openvidu-server:4443';
const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';

const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN
}));

const server = http.createServer(app);

let session: Session | null = null;

app.get('/health', async (req, res) => {
  try {
    await openvidu.fetch();
    res.status(200).json({ status: 'OK', message: 'Connected to OpenVidu server' });
  } catch (error) {
    console.error('Error connecting to OpenVidu server:', error);
    res.status(500).json({ status: 'Error', message: 'Failed to connect to OpenVidu server' });
  }
});

console.log('OpenVidu URL:', OPENVIDU_URL);
console.log('OpenVidu Secret:', OPENVIDU_SECRET);

let activeSession: any = null;

app.post('/generate-token', async (req, res) => {
  try {
    if (!activeSession) {
      console.log('Creating new session');
      activeSession = await openvidu.createSession();
    }
    console.log('Creating connection for session:', activeSession.sessionId);
    const connection = await activeSession.createConnection();

    // Modify the token to use the correct server address
    const modifiedToken = connection.token.replace('ws://localhost:4443', `wss://${new URL(OPENVIDU_URL).hostname}:4443`);

    console.log('Token generated:', modifiedToken);
    res.status(200).json({ token: modifiedToken });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Error generating token', details: (error as Error).message });
  }
});

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Server is running on port ${port}`));

export default app;
export { openvidu };