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
      if (!UserService.isUserExists(userId)) {
        UserService.addUser(userId);
      }

      // Send current users and their positions
      io.emit("update-users", UserService.getUsers());
      socket.emit("all-positions", userPositions);
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