import { Server } from "socket.io";
import { CanvasController } from "../modules/canvas/canvas.controller";
import { AiController } from "../modules/ai/ai.controller";
import { UserService } from "../modules/user/user.service";

// Add positions store
const userPositions: Record<string, { x: number; y: number }> = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    socket.on("register-user", (userId) => {
      // Remember who this socket belongs to, for disconnect cleanup
      socket.data.userId = userId;

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

      UserService.removeUser(userId);
      delete userPositions[userId];
      io.emit("update-users", UserService.getUsers());
      io.emit("update-user-position", { userId, x: null, y: null });
    });

    socket.on("user-left", (userId) => {
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