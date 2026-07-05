import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";
import ActiveUsers from "./components/ActiveUsers";
import AiChatBox from "./components/AiChatBox";
import ServerWakeOverlay from "./components/ServerWakeOverlay";
import pencilIcon from "./assets/pencil.svg";
import "./App.css";
import { styled } from "@mui/material/styles";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5001";
const SOCKET_URL = SERVER_URL;
const API_URL = SERVER_URL;

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
  const [drawing, setDrawing] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any>();
  const [showPencil, setShowPencil] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [userPositions, setUserPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

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
        data.canvasState.forEach((line: { x1: number; y1: number; x2: number; y2: number }) => {
          if (line.x1 !== undefined && line.y1 !== undefined &&
            line.x2 !== undefined && line.y2 !== undefined) {
            drawLine(line.x1, line.y1, line.x2, line.y2);
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

    socket.on("draw", ({ x1, y1, x2, y2 }) => drawLine(x1, y1, x2, y2));
    socket.on("canvas-cleared", () => ctx?.clearRect(0, 0, canvas.width, canvas.height));

    return () => {
      socket.off("draw");
      socket.off("canvas-cleared");
    };
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
  };

  const stopDrawing = () => {
    setDrawing(false);
    setLastPos(null);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !canvasRef.current || !ctxRef.current || !userId) return;

    let x: number, y: number;
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = -35;
    const offsetY = 0;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left + offsetX;
      y = e.touches[0].clientY - rect.top + offsetY;
    } else {
      x = e.clientX - rect.left + offsetX;
      y = e.clientY - rect.top + offsetY;
    }

    if (lastPos) {
      drawLine(lastPos.x, lastPos.y, x, y); // Draw between last position and new position
      socket.emit("draw", { x1: lastPos.x, y1: lastPos.y, x2: x, y2: y });
    }
    else {
      drawLine(x, y, x, y);
      socket.emit("draw", { x1: x, y1: y, x2: x, y2: y });
    }
    setLastPos({ x, y });
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    if (!ctxRef.current) return;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x1, y1);
    ctxRef.current.lineTo(x2, y2);
    ctxRef.current.stroke();
    ctxRef.current.closePath();
  };

  const moveCursor = (e: React.MouseEvent | React.TouchEvent) => {
    if (cursorRef.current && userId) {
      let x: number, y: number;
      if ("touches" in e) {
        x = e.touches[0].clientX + window.scrollX;
        y = e.touches[0].clientY + window.scrollY;
      } else {
        x = e.clientX + window.scrollX;
        y = e.clientY + window.scrollY;
      }

      cursorRef.current.style.left = `${x}px`;
      cursorRef.current.style.top = `${y}px`;

      socket.emit("user-drawing", { userId, x, y });
    }
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

      <StyledWrapper
        onMouseMove={moveCursor}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        >

        {!isTouchDevice && showPencil && (
          <div
            ref={cursorRef}
            className={`custom-cursor ${drawing ? 'pressed' : ''}`}
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
            // onTouchMove={draw}
          />
        </div>

      </StyledWrapper>
    </>
  );
};

export default App;
