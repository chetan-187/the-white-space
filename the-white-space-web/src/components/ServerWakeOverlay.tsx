import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { styled } from "@mui/material/styles";

// Only shown if the socket hasn't connected after this long — a warm server
// (or localhost) connects faster and the overlay never appears.
const SHOW_DELAY_MS = 600;
const MESSAGE_ROTATE_MS = 4000;

const MESSAGES = [
  "We're on Render's free plan — the server literally naps between visitors. It's stretching now… ☕",
  "The hamster powering our free-tier server has been woken up. He's finding his tiny running shoes 🐹",
  "Server was in deep sleep. It heard you knock. It's putting on pants. ~30 seconds.",
  "Fun fact: free hosting sleeps harder than a cat in the sun. Almost awake now… 😴",
  "Still cheaper than paying for hosting. Thanks for your patience, hero. 🦸",
];

const Overlay = styled('div')({
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(248, 249, 250, 0.85)',
  backdropFilter: 'blur(2px)',
});

const Card = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  maxWidth: 380,
  margin: 16,
  padding: '28px 32px',
  textAlign: 'center',
  backgroundColor: '#ffffff',
  border: '3px solid #000000',
  borderRadius: 16,
  boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)',
  fontFamily: "'Poppins', sans-serif",
});

const Title = styled('div')({
  fontSize: 20,
  fontWeight: 800,
  color: '#000000',
});

const Message = styled('div')({
  fontSize: 14,
  fontWeight: 600,
  color: '#333333',
  minHeight: 63,
});

const Dots = styled('div')({
  display: 'flex',
  gap: 8,
  '@keyframes wakeBounce': {
    '0%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-10px)' },
  },
  '& span': {
    display: 'inline-block',
    width: 14,
    height: 14,
    backgroundColor: '#ffd43b',
    border: '2px solid #000000',
    borderRadius: 4,
    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
    animation: 'wakeBounce 1.1s infinite',
  },
  '& span:nth-of-type(2)': { animationDelay: '0.15s' },
  '& span:nth-of-type(3)': { animationDelay: '0.3s' },
});

interface ServerWakeOverlayProps {
  socket: Socket;
}

const ServerWakeOverlay: React.FC<ServerWakeOverlayProps> = ({ socket }) => {
  const [connected, setConnected] = useState(socket.connected);
  const [visible, setVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (socket.connected) {
      setConnected(true);
      return;
    }

    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    const handleConnect = () => setConnected(true);

    socket.on('connect', handleConnect);
    return () => {
      clearTimeout(showTimer);
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  useEffect(() => {
    if (!visible || connected) return;
    const rotate = setInterval(
      () => setMessageIndex((i) => (i + 1) % MESSAGES.length),
      MESSAGE_ROTATE_MS,
    );
    return () => clearInterval(rotate);
  }, [visible, connected]);

  if (connected || !visible) return null;

  return (
    <Overlay>
      <Card>
        <Title>Waking up the server… ⏰</Title>
        <Message>{MESSAGES[messageIndex]}</Message>
        <Dots>
          <span />
          <span />
          <span />
        </Dots>
      </Card>
    </Overlay>
  );
};

export default ServerWakeOverlay;
