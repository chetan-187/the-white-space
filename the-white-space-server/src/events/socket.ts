import { Server } from "socket.io";
import { CanvasController } from "../modules/canvas/canvas.controller";
import { AiController } from "../modules/ai/ai.controller";
import { UserService } from "../modules/user/user.service";

// Add positions store
const userPositions: Record<string, { x: number; y: number }> = {};

// Latest socket that registered each user. A refresh creates a new socket
// before the old one's disconnect is detected — without this ownership check,
// the stale socket's late disconnect would delete the freshly registered user.
const userSockets: Record<string, string> = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    socket.on("register-user", (userId) => {
      // Remember who this socket belongs to, for disconnect cleanup
      socket.data.userId = userId;
      userSockets[userId] = socket.id;

      if (!UserService.isUserExists(userId)) {
        UserService.addUser(userId);
      }

      // Send current users and their positions
      io.emit("update-users", UserService.getUsers());
      socket.emit("all-positions", userPositions);
    });

    // Server-side cleanup guarantee: fires on ANY connection loss (killed tab,
    // network drop, mobile), unlike the client's beforeunload "user-left"
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (!userId) return;

      // Only the user's current socket may clean up — a stale socket's late
      // disconnect (refresh race) must not remove the re-registered user
      if (userSockets[userId] !== socket.id) return;

      delete userSockets[userId];
      UserService.removeUser(userId);
      delete userPositions[userId];
      io.emit("update-users", UserService.getUsers());
      io.emit("update-user-position", { userId, x: null, y: null });
    });

    socket.on("user-left", (userId) => {
      // Ignore if a newer socket (e.g. the post-refresh page) owns this user
      if (userSockets[userId] !== socket.id) return;

      delete userSockets[userId];
      UserService.removeUser(userId);
      delete userPositions[userId];
      io.emit("update-users", UserService.getUsers());
      io.emit("update-user-position", { userId, x: null, y: null });
    });

    socket.on("user-drawing", (data) => {
      userPositions[data.userId] = { x: data.x, y: data.y };
      io.emit("update-user-position", data);
    });

    socket.on("request-positions", () => {
      socket.emit("all-positions", userPositions);
    });

    CanvasController(socket, io);
    AiController(socket, io);
  });
};