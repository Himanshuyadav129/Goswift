require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const busRoutes = require("./routes/bus");
const driverRoutes = require("./routes/driver");
const Bus = require("./models/Bus"); // NEW

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", busRoutes);
app.use("/api", driverRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB Connected");
})
.catch(err=>{
    console.log("MongoDB Error:", err);
});

app.get("/", (req,res)=>{
    res.send("GoSwift Backend Running");
});

// ⚡ Socket.io Setup
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

io.on("connection",(socket)=>{
    console.log("User Connected:", socket.id);

    // Driver sends location
    socket.on("busLocation", async(data)=>{

        console.log("Bus Location:",data);

        try{

            const { busId, latitude, longitude } = data;

            // DB update
            await Bus.findByIdAndUpdate(busId,{
                latitude: latitude,
                longitude: longitude
            });

            // send to all passengers
            io.emit("busLocationUpdate",{
                busId,
                latitude,
                longitude
            });

        }catch(err){
            console.log("Location update error:",err);
        }

    });

    socket.on("disconnect",()=>{
        console.log("User Disconnected");
    });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, ()=>{
    console.log("Server running on port " + PORT);
});