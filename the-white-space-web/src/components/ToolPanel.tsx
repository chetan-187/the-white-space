import React from "react";
import { styled } from "@mui/material/styles";
import pencilIcon from "../assets/pencil.svg";

export type Tool = 'pen' | 'eraser';

const Panel = styled('div')({
  position: 'fixed',
  left: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: 10,
  borderRadius: 12,
  backgroundColor: '#f8f9fa',
  border: '2px solid #000000',
  boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
  fontFamily: "'Poppins', sans-serif",
  '@media (max-width: 600px)': {
    left: 8,
  },
});

const ToolButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  border: '2px solid #000000',
  backgroundColor: active ? '#ffd43b' : '#ffffff',
  boxShadow: active
    ? '1px 1px 0px rgba(0, 0, 0, 0.8)'
    : '3px 3px 0px rgba(0, 0, 0, 0.8)',
  transform: active ? 'translate(2px, 2px)' : 'none',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
  fontSize: 22,
  fontWeight: 800,
  fontFamily: 'inherit',
  color: '#000000',
  padding: 0,
  '&:hover': {
    backgroundColor: active ? '#ffd43b' : '#f0f0f0',
  },
}));

const Divider = styled('div')({
  width: '80%',
  height: 2,
  backgroundColor: '#000000',
  borderRadius: 1,
});

const ZoomLabel = styled('div')({
  fontSize: 11,
  fontWeight: 800,
  color: '#000000',
});

const EraserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <g transform="rotate(-45 12 12)">
      <rect x="3" y="8" width="18" height="8" rx="2" fill="#ffc9c9" stroke="#000000" strokeWidth="2" />
      <rect x="3" y="8" width="8" height="8" rx="2" fill="#74c0fc" stroke="#000000" strokeWidth="2" />
    </g>
  </svg>
);

interface ToolPanelProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
  tool,
  onToolChange,
  zoom,
  onZoomIn,
  onZoomOut,
}) => (
  <Panel>
    <ToolButton
      active={tool === 'pen'}
      onClick={() => onToolChange('pen')}
      title="Pencil"
    >
      <img src={pencilIcon} alt="Pencil" width={24} height={24} />
    </ToolButton>
    <ToolButton
      active={tool === 'eraser'}
      onClick={() => onToolChange('eraser')}
      title="Eraser"
    >
      <EraserIcon />
    </ToolButton>
    <Divider />
    <ToolButton onClick={onZoomIn} title="Zoom in">+</ToolButton>
    <ToolButton onClick={onZoomOut} title="Zoom out">−</ToolButton>
    <ZoomLabel>{Math.round(zoom * 100)}%</ZoomLabel>
  </Panel>
);

export default ToolPanel;
