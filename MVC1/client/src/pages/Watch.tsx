import React, { useEffect, useState } from 'react';
import { OpenVidu, Session, StreamEvent, StreamManager } from 'openvidu-browser';

const Watch: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [mainStreamManager, setMainStreamManager] = useState<StreamManager | null>(null);
  const [subscribers, setSubscribers] = useState<StreamManager[]>([]);

  useEffect(() => {
    const initializeSession = async () => {
      const OV = new OpenVidu();
      const session = OV.initSession();

      setSession(session);

      session.on('streamCreated', (event: StreamEvent) => {
        console.log('Stream created:', event.stream.streamId);
        const subscriber = session.subscribe(event.stream, undefined);
        subscriber.on('streamPlaying', () => {
          console.log('Subscriber playing:', subscriber.stream.streamId);
        });
        setSubscribers(prevSubscribers => {
          // Check if this stream is already in the list
          if (!prevSubscribers.find(sub => sub.stream.streamId === subscriber.stream.streamId)) {
            return [...prevSubscribers, subscriber];
          }
          return prevSubscribers;
        });

        if (!mainStreamManager) {
          setMainStreamManager(subscriber);
        }
      });

      session.on('streamDestroyed', (event: StreamEvent) => {
        console.log('Stream destroyed:', event.stream.streamId);
        setSubscribers(prevSubscribers => 
          prevSubscribers.filter(sub => sub.stream.streamId !== event.stream.streamId)
        );
      });

      session.on('exception', (exception) => {
        console.warn('Exception in session:', exception);
      });

      try {
        const response = await fetch('http://localhost:3000/generate-token', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'SUBSCRIBER' })
        });
        const data = await response.json();
        const token = data.token;
        console.log("Token received:", token);

        await session.connect(token);
        console.log('Session connected');
      } catch (error) {
        console.error('Error in watching:', error);
      }
    };

    initializeSession();

    return () => {
      if (session) {
        session.disconnect();
      }
    };
  }, []);

  const handleMainVideoStream = (stream: StreamManager) => {
    if (mainStreamManager !== stream) {
      setMainStreamManager(stream);
    }
  };

  return (
    <div className="watcher-container">
      <h2>Broadcast Viewer</h2>
      {mainStreamManager ? (
        <div className="main-video-container">
          <h3>Main Stream</h3>
          <video 
            ref={video => {
              if (video) {
                video.muted = true;
                mainStreamManager.addVideoElement(video);
              }
            }}
            autoPlay
            playsInline
          />
        </div>
      ) : (
        <p>Waiting for streams...</p>
      )}
      <div className="subscribers-container">
        <h3>All Streams ({subscribers.length})</h3>
        {subscribers.map((sub) => (
          <div 
            key={sub.stream.streamId}
            className="subscriber-video"
            onClick={() => handleMainVideoStream(sub)}
          >
            <video 
              ref={video => {
                if (video) {
                  video.muted = true;
                  sub.addVideoElement(video);
                }
              }} 
              autoPlay
              playsInline
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watch;