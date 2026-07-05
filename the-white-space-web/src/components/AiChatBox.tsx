import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";

// Flip to true when the wallet recovers
const AI_ENABLED = false;

const DISABLED_MESSAGE =
  "🎨 AI artist is on an unpaid break - the API bills drew all over my wallet. Coming soon!";

const ChatBoxWrapper = styled('div')({
  position: 'fixed',
  bottom: 16,
  left: 16,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: 300,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#f8f9fa',
  border: '2px solid #000000',
  boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
  fontFamily: "'Poppins', sans-serif",
  '@media (max-width: 600px)': {
    bottom: 8,
    left: 8,
    width: 'calc(100vw - 48px)',
  },
});

const InputRow = styled('form')({
  display: 'flex',
  gap: 8,
});

const PromptInput = styled('input')({
  flex: 1,
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: 8,
  border: '2px solid #000000',
  backgroundColor: '#ffffff',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:focus': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)',
  },
  '&:disabled': {
    backgroundColor: '#e9ecef',
  },
  '&::placeholder': {
    color: '#868e96',
    fontWeight: 500,
  },
});

const SendButton = styled('button')({
  padding: '8px 14px',
  borderRadius: 8,
  border: '2px solid #000000',
  backgroundColor: '#ffd43b',
  color: '#000000',
  fontSize: 14,
  fontWeight: 800,
  fontFamily: 'inherit',
  cursor: 'pointer',
  boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.8)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover:not(:disabled)': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '5px 5px 0px rgba(0, 0, 0, 0.8)',
  },
  '&:active:not(:disabled)': {
    transform: 'translate(1px, 1px)',
    boxShadow: '1px 1px 0px rgba(0, 0, 0, 0.8)',
  },
  '&:disabled': {
    backgroundColor: '#e9ecef',
    color: '#868e96',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
});

const StyledTooltip = styled(
  ({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  )
)(() => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: '#ffd43b',
    color: '#000000',
    border: '2px solid #000000',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    fontWeight: 700,
    fontFamily: "'Poppins', sans-serif",
    maxWidth: 260,
  },
  '& .MuiTooltip-arrow': {
    color: '#ffd43b',
    '&::before': {
      backgroundColor: '#ffd43b',
      border: '2px solid #000000',
    },
  },
}));

const StatusText = styled('div')<{ error?: boolean }>(({ error }) => ({
  fontSize: 12,
  fontWeight: 700,
  padding: '4px 8px',
  borderRadius: 8,
  border: '2px solid #000000',
  backgroundColor: error ? '#ffc9c9' : '#d3f9d8',
  color: '#000000',
}));

type AiDrawStatus =
  | { status: 'generating' }
  | { status: 'done'; count: number }
  | { status: 'error'; message: string };

interface AiChatBoxProps {
  socket: Socket;
}

const AiChatBox: React.FC<AiChatBoxProps> = ({ socket }) => {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const handleStatus = (data: AiDrawStatus) => {
      if (data.status === 'generating') {
        setGenerating(true);
        setIsError(false);
        setStatusMessage('Drawing…');
      } else if (data.status === 'done') {
        setGenerating(false);
        setIsError(false);
        setStatusMessage('Done!');
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        setGenerating(false);
        setIsError(true);
        setStatusMessage(data.message);
      }
    };

    socket.on('ai-draw-status', handleStatus);
    return () => {
      socket.off('ai-draw-status', handleStatus);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!AI_ENABLED) return;
    const trimmed = prompt.trim();
    if (!trimmed || generating) return;

    socket.emit('ai-draw', { prompt: trimmed });
    setGenerating(true);
    setIsError(false);
    setStatusMessage('Drawing…');
    setPrompt("");
  };

  const chatBox = (
    <ChatBoxWrapper>
      <InputRow onSubmit={handleSubmit}>
        <PromptInput
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={AI_ENABLED ? "Ask AI to draw…" : "AI is napping… 💤"}
          disabled={!AI_ENABLED || generating}
        />
        <SendButton
          type="submit"
          disabled={!AI_ENABLED || generating || !prompt.trim()}
        >
          {AI_ENABLED ? (generating ? '…' : 'Draw') : 'Soon™'}
        </SendButton>
      </InputRow>
      {statusMessage && <StatusText error={isError}>{statusMessage}</StatusText>}
    </ChatBoxWrapper>
  );

  if (!AI_ENABLED) {
    return (
      <StyledTooltip title={DISABLED_MESSAGE} arrow placement="top">
        {chatBox}
      </StyledTooltip>
    );
  }

  return chatBox;
};

export default AiChatBox;
