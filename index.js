require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./actions");

//creating express app
const app = express();

//connecting to database
connectDB();

//middleware
app.use(express.json());
app.use(cors());

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

const server = http.createServer(app);
const io = new Server(server);
io.on("connection", (socket) => {
  console.log("------------------a user connected-------------------------");
  console.log(socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    console.log(`Socket User name:${username}`);
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    console.log(code);
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    console.log(
      "------------------a user disconnected-------------------------"
    );
    console.log(userSocketMap);
    socket.leave();
  });
});

//routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

const port = process.env.PORT || 8080;
server.listen(port, () => console.log(`Listening on port ${port}`));
