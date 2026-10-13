import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;

export const initIO = (server: HttpServer) => {
  io = new Server(server, { cors: { origin: "*" } });
  return io;
};

export const emitTaskEvent = (event: string, payload: unknown) => {
  if (io) io.emit(event, payload);
};

export const closeIO = () => new Promise<void>((resolve) => io.close(() => resolve()));