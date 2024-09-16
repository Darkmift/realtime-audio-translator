import express from 'express';
import http from 'http';
import cors from 'cors';
import { OpenVidu, OpenViduRole, Session } from 'openvidu-node-client';

const OPENVIDU_URL = process.env.OPENVIDU_URL || 'http://localhost:4443';
const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';

const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const server = http.createServer(app);

let session: Session | null = null;

app.post('/generate-token', async (req, res) => {
  try {
    if (!session) {
      session = await openvidu.createSession({});
    }

    const connection = await session.createConnection({
      role: req.body.role || OpenViduRole.PUBLISHER,
    });

    res.status(200).send({ token: connection.token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).send('Error generating token');
  }
});

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Server is running on port ${port}`));

export default app;
export { openvidu };