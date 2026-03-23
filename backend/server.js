require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const busRoutes = require("./routes/bus");

const Bus = require("./models/Bus");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", busRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

const server = http.createServer(app);

const io = new Server(server,{
  cors:{ origin:"*" }
});

io.on("connection",(socket)=>{

  socket.on("busLocation", async(data)=>{

    const { busId, latitude, longitude } = data;

    await Bus.findByIdAndUpdate(busId,{
      latitude,
      longitude
    });

    io.emit("busLocationUpdate",{
      busId,
      latitude,
      longitude
    });

  });

});

server.listen(5000, ()=>{
  console.log("Server running on port 5000");
});