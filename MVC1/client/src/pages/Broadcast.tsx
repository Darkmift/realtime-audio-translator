import React, { useEffect, useRef, useState } from 'react';
import { OpenVidu, Publisher, Session, StreamEvent, StreamManager } from 'openvidu-browser';

const OPENVIDU_SERVER_URL =
  import.meta.env.VITE_OPENVIDU_SERVER_URL || 'https://164.90.228.80:4443';
const API_URL = import.meta.env.VITE_API_URL || 'http://164.90.228.80:3000';

const BroadcastComponent: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializeSession = async () => {
      console.log('Initializing OpenVidu session');
      const OV = new OpenVidu();

      OV.setAdvancedConfiguration({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          {
            urls: [`turn:${new URL(OPENVIDU_SERVER_URL).hostname}:3478`],
            username: 'OPENVIDUAPP',
            credential: import.meta.env.VITE_OPENVIDU_SECRET,
          },
        ],
        forceMediaReconnectionAfterNetworkDrop: true,
        iceConnectionDisconnectedExceptionTimeout: 15000,
        noStreamPlayingEventExceptionTimeout: 15000,
      });

      const session = OV.initSession();
      console.log('Session initialized');

      setSession(session);

      session.on('streamCreated', (event: StreamEvent) => {
        console.log('New stream created:', event.stream.streamId);
        const subscriber = session.subscribe(event.stream, undefined);
        setSubscribers((prev) => [...prev, subscriber]);
      });

      session.on('streamDestroyed', (event: StreamEvent) => {
        console.log('Stream destroyed:', event.stream.streamId);
        setSubscribers((prev) => prev.filter((sub) => sub !== event.stream.streamManager));
      });

      session.on('exception', (exception) => {
        console.warn('Exception in session:', exception);
      });

      try {
        const response = await fetch(`${API_URL}/generate-token`, { method: 'POST' });
        const data = await response.json();
        console.log('Received token data:', data);
        const token = data.token;

        console.log('Connecting to session with token');
        await session.connect(token);
        console.log('Session connected successfully');

        console.log('Initializing publisher');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia is not supported in this browser');
        }
    
        // Request permissions before initializing the publisher
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const publisher = await OV.initPublisherAsync(undefined, {
          audioSource: undefined,
          videoSource: undefined,
          publishAudio: true,
          publishVideo: true,
          resolution: '640x480',
          frameRate: 30,
          insertMode: 'APPEND',
          mirror: false,
        });

        console.log('Publisher initialized');

        setPublisher(publisher);

        if (videoRef.current) {
          videoRef.current.srcObject = publisher.stream.getMediaStream();
        }
      } catch (error) {
        console.error('Error in broadcasting:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    };

    initializeSession();

    return () => {
      if (session) {
        session.disconnect();
      }
    };
  }, []);

  const startBroadcast = async () => {
    if (session && publisher) {
      try {
        await session.publish(publisher);
        setIsBroadcasting(true);
        console.log('Broadcast started');
      } catch (error) {
        console.error('Error starting broadcast:', error);
      }
    }
  };

  const endBroadcast = () => {
    if (session && publisher) {
      session.unpublish(publisher);
      setIsBroadcasting(false);
      console.log('Broadcast ended');
    }
  };

  const toggleAudio = () => {
    if (publisher) {
      const enableAudio = !publisher.stream.audioActive;
      publisher.publishAudio(enableAudio);
      console.log(`Audio ${enableAudio ? 'enabled' : 'disabled'}`);
    }
  };

  const toggleVideo = () => {
    if (publisher) {
      const enableVideo = !publisher.stream.videoActive;
      publisher.publishVideo(enableVideo);
      console.log(`Video ${enableVideo ? 'enabled' : 'disabled'}`);
    }
  };

  return (
    <div className="broadcast-container">
      <h2>Broadcast {isBroadcasting ? '(Live)' : '(Not Live)'}</h2>
      <div className="video-container">
        <video ref={videoRef} autoPlay muted className="publisher-video" />
        <div className="controls">
          <button onClick={toggleAudio}>Toggle Audio</button>
          <button onClick={toggleVideo}>Toggle Video</button>
          {!isBroadcasting ? (
            <button onClick={startBroadcast}>Start Broadcast</button>
          ) : (
            <button onClick={endBroadcast}>End Broadcast</button>
          )}
        </div>
      </div>
      <div className="subscribers-container">
        <h3>Viewers ({subscribers.length})</h3>
        {subscribers.map((sub, index) => (
          <div key={index} className="subscriber-video">
            <video
              ref={(el) => {
                if (el) {
                  sub.addVideoElement(el);
                }
              }}
              autoPlay
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BroadcastComponent;
