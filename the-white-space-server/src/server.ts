import http from 'http';
import { Server } from 'socket.io';
import { config } from './config/env';
import app from './app';
import { setupSocket } from './events/socket';

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

setupSocket(io);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
