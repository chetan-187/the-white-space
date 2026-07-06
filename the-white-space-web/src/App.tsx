import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";
import ActiveUsers from "./components/ActiveUsers";
import AiChatBox from "./components/AiChatBox";
import ServerWakeOverlay from "./components/ServerWakeOverlay";
import ToolPanel, { Tool } from "./components/ToolPanel";
import pencilIcon from "./assets/pencil.svg";
import "./App.css";
import { styled } from "@mui/material/styles";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5001";
const SOCKET_URL = SERVER_URL;
const API_URL = SERVER_URL;

// Screen-sized scroll container: the document never exceeds the viewport, so
// position:fixed UI (user icons, chatbox) stays visible on mobile browsers.
const ScrollContainer = styled('div')({
  width: '100vw',
  height: '100vh',
  overflow: 'auto',
  overscrollBehavior: 'none',
  '@supports (height: 100dvh)': {
    height: '100dvh',
  },
});

const StyledWrapper = styled('div')({
  position: 'relative',
  width: '5000px',
  height: '5000px',
  overflow: 'hidden'
});

const ActiveUsersWrapper = styled('div')({
  position: 'fixed',
  top: 16,
  right: 16,
  zIndex: 9999,
  '@media (max-width: 600px)': {
    top: 8,
    right: 8,
  }
});

const socket = io(SOCKET_URL);

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any>();
  const [showPencil, setShowPencil] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [userPositions, setUserPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const pinchRef = useRef<{
    dist: number;
    zoom: number;
    midX: number;
    midY: number;
  } | null>(null);

  const applyZoom = (nextZoom: number, anchorX?: number, anchorY?: number) => {
    const clamped = Math.min(3, Math.max(0.25, nextZoom));
    const previous = zoomRef.current;
    if (clamped === previous) return;

    zoomRef.current = clamped;
    setZoom(clamped);

    // Adjust scroll so the anchor point (pinch midpoint or screen center)
    // stays under the same spot on screen
    const container = scrollRef.current;
    if (container) {
      const ax = anchorX ?? container.clientWidth / 2;
      const ay = anchorY ?? container.clientHeight / 2;
      const ratio = clamped / previous;
      const targetLeft = (container.scrollLeft + ax) * ratio - ax;
      const targetTop = (container.scrollTop + ay) * ratio - ay;
      requestAnimationFrame(() => {
        container.scrollLeft = targetLeft;
        container.scrollTop = targetTop;
      });
    }
  };

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);



  useEffect(() => {
    socket.on("update-user-position", (data) => {
      if (data.x === null && data.y === null) {
        setUserPositions((prev) => {
          const newPositions = { ...prev };
          delete newPositions[data.userId];
          return newPositions;
        });
      } else {
        setUserPositions((prev) => ({
          ...prev,
          [data.userId]: { x: data.x, y: data.y }
        }));
      }
    });

    socket.on("all-positions", (positions) => {
      setUserPositions(positions);
    });

    // Request initial positions
    socket.emit("request-positions");

    return () => {
      socket.off("update-user-position");
      socket.off("all-positions");
    };
  }, []);



  const fetchCanvasState = async () => {
    try {
      const response = await fetch(`${API_URL}/canvas-state`);
      const data = await response.json();

      if (!ctxRef.current || !canvasRef.current) return;

      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (data.canvasState && Array.isArray(data.canvasState)) {
        data.canvasState.forEach((line: { x1: number; y1: number; x2: number; y2: number; tool?: string }) => {
          if (line.x1 !== undefined && line.y1 !== undefined &&
            line.x2 !== undefined && line.y2 !== undefined) {
            drawLine(line.x1, line.y1, line.x2, line.y2, line.tool);
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch canvas state:', error);
    }
  };

  useEffect(() => {
    let storedUserId = localStorage.getItem("user_id");

    if (!storedUserId) {
      storedUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("user_id", storedUserId);
    }

    setUserId(storedUserId);

    // Set up socket listeners before emitting registration
    socket.on("update-users", (users) => {
      setActiveUsers(users);
    });

    // Register user and request initial state
    socket.emit("register-user", storedUserId);
    socket.emit("request-positions");

    const handleUnload = () => {
      socket.emit("user-left", storedUserId);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      socket.emit("user-left", storedUserId);
      socket.off("update-users");
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 5000;
    canvas.height = 5000;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingQuality = 'high';

      // Set drawing style
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctxRef.current = ctx;


      fetchCanvasState();
    }

    socket.on("draw", ({ x1, y1, x2, y2, tool }) => drawLine(x1, y1, x2, y2, tool));
    socket.on("canvas-cleared", () => ctx?.clearRect(0, 0, canvas.width, canvas.height));

    return () => {
      socket.off("draw");
      socket.off("canvas-cleared");
    };
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Two fingers = pinch zoom, not drawing
    if ("touches" in e && e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchRef.current = {
        dist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
        zoom: zoomRef.current,
        midX: (t1.clientX + t2.clientX) / 2,
        midY: (t1.clientY + t2.clientY) / 2,
      };
      setDrawing(false);
      setLastPos(null);
      return;
    }
    e.preventDefault();
    setDrawing(true);
  };

  const stopDrawing = () => {
    pinchRef.current = null;
    setDrawing(false);
    setLastPos(null);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !ctxRef.current || !userId) return;

    // Ongoing two-finger gesture: pan + zoom in one motion
    if ("touches" in e && e.touches.length >= 2) {
      const pinch = pinchRef.current;
      const container = scrollRef.current;
      if (pinch && container) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        const zOld = zoomRef.current;
        const zNew = Math.min(3, Math.max(0.25, (pinch.zoom * dist) / pinch.dist));

        // The content point that was under the previous finger-midpoint must
        // end up under the new midpoint — this one formula covers panning
        // (midpoint moved), zooming (distance changed), and anchoring.
        const contentX = (container.scrollLeft + pinch.midX) / zOld;
        const contentY = (container.scrollTop + pinch.midY) / zOld;
        const targetLeft = contentX * zNew - midX;
        const targetTop = contentY * zNew - midY;

        if (zNew !== zOld) {
          zoomRef.current = zNew;
          setZoom(zNew);
          // Wait for the re-render so the scroll area can fit the new scale
          requestAnimationFrame(() => {
            container.scrollLeft = targetLeft;
            container.scrollTop = targetTop;
          });
        } else {
          container.scrollLeft = targetLeft;
          container.scrollTop = targetTop;
        }

        pinch.midX = midX;
        pinch.midY = midY;
      }
      return;
    }

    if (!drawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    // Converts screen px to canvas px at any zoom level
    const scale = canvasRef.current.width / rect.width;

    let x: number, y: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      // No cursor-hotspot offset on touch — draw exactly under the finger
      x = (e.touches[0].clientX - rect.left) * scale;
      y = (e.touches[0].clientY - rect.top) * scale;
    } else {
      // -35 compensates for the pencil cursor icon's hotspot (in screen px)
      x = (e.clientX - 35 - rect.left) * scale;
      y = (e.clientY - rect.top) * scale;
    }

    if (lastPos) {
      drawLine(lastPos.x, lastPos.y, x, y, tool); // Draw between last position and new position
      socket.emit("draw", { x1: lastPos.x, y1: lastPos.y, x2: x, y2: y, tool });
    }
    else {
      drawLine(x, y, x, y, tool);
      socket.emit("draw", { x1: x, y1: y, x2: x, y2: y, tool });
    }
    setLastPos({ x, y });
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    segmentTool: string = 'pen',
  ) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    if (segmentTool === 'eraser') {
      // destination-out makes pixels transparent again, so the dotted CSS
      // background shows through instead of white smears
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
    }
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
    if (segmentTool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 5;
    }
  };

  const moveCursor = (e: React.MouseEvent | React.TouchEvent) => {
    if (!userId) return;
    // Multi-touch is a pinch gesture — no single position to broadcast
    if ("touches" in e && e.touches.length !== 1) return;

    const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    // Cursor/badges live inside the scaled wrapper, so convert to content coords
    const z = zoomRef.current;
    let x: number, y: number;
    if ("touches" in e) {
      x = (e.touches[0].clientX + scrollLeft) / z;
      y = (e.touches[0].clientY + scrollTop) / z;
    } else {
      x = (e.clientX + scrollLeft) / z;
      y = (e.clientY + scrollTop) / z;
    }

    // The pencil cursor div only exists on mouse devices
    if (cursorRef.current) {
      cursorRef.current.style.left = `${x}px`;
      cursorRef.current.style.top = `${y}px`;
    }

    socket.emit("user-drawing", { userId, x, y });
  };

  const handleMouseEnter = () => {
    setShowPencil(true);
    document.body.style.cursor = "none"; // Hide system cursor globally
  };
  
  const handleMouseLeave = () => {
    setShowPencil(false);
    document.body.style.cursor = "default"; // Restore system cursor when leaving
  };

  return (
    <>
      <ServerWakeOverlay socket={socket} />

      {activeUsers && (
        <ActiveUsersWrapper
          onMouseEnter={() => setShowPencil(false)}
          onMouseLeave={() => setShowPencil(true)}
        >
          <ActiveUsers users={activeUsers} />
        </ActiveUsersWrapper>
      )}

      <div
        onMouseEnter={() => setShowPencil(false)}
        onMouseLeave={() => setShowPencil(true)}
      >
        <AiChatBox socket={socket} />
      </div>

      <div
        onMouseEnter={() => setShowPencil(false)}
        onMouseLeave={() => setShowPencil(true)}
      >
        <ToolPanel
          tool={tool}
          onToolChange={setTool}
          zoom={zoom}
          onZoomIn={() => applyZoom(zoomRef.current * 1.25)}
          onZoomOut={() => applyZoom(zoomRef.current / 1.25)}
        />
      </div>

      <ScrollContainer ref={scrollRef}>
      {/* Sizer keeps the scrollable area in sync with the scaled canvas */}
      <div style={{ width: 5000 * zoom, height: 5000 * zoom }}>
      <StyledWrapper
        onMouseMove={moveCursor}
        onTouchMove={moveCursor}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
        >

        {!isTouchDevice && showPencil && (
          <div
            ref={cursorRef}
            className={`custom-cursor ${drawing ? 'pressed' : ''} ${tool === 'eraser' ? 'eraser' : ''}`}
          >
            <img src={pencilIcon} alt="Pencil Cursor" />
          </div>
        )}

        {activeUsers &&
          Object.keys(activeUsers).map((user) => {
            const pos = userPositions[user];
            if (!pos || user === userId) return null;

            return (
              <div
                key={user}
                className="user-badge"
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  backgroundColor: activeUsers[user].color,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <span className="user-name">
                  {activeUsers[user].name.charAt(0)}
                </span>
              </div>
            );
          })
        }



        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            className="canvas"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />
        </div>

      </StyledWrapper>
      </div>
      </ScrollContainer>
    </>
  );
};

export default App;
