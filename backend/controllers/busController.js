const Bus = require("../models/Bus");

exports.addBus = async (req,res)=>{
try{

const {busNumber,driverName} = req.body;

const bus = new Bus({
busNumber,
driverName
});

await bus.save();

res.json({message:"Bus added successfully"});

}catch(err){
res.status(500).json({message:err.message});
}
}

exports.getAllBus = async (req,res)=>{
try{

const buses = await Bus.find();

res.json(buses);

}catch(err){
res.status(500).json({message:err.message});
}
}

exports.updateLocation = async (req,res)=>{
try{

const {busId,latitude,longitude} = req.body;

const bus = await Bus.findByIdAndUpdate(
busId,
{latitude,longitude},
{new:true}
);

res.json(bus);

}catch(err){
res.status(500).json({message:err.message});
}
}


// STEP 3 → Nearest Bus Algorithm
exports.getNearestBus = async (req,res)=>{
try{

const {lat,lng} = req.query;

const buses = await Bus.find();

let nearestBus = null;
let minDistance = Infinity;

// Haversine formula
function getDistance(lat1,lon1,lat2,lon2){

const R = 6371;

const dLat = (lat2-lat1) * Math.PI/180;
const dLon = (lon2-lon1) * Math.PI/180;

const a =
Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(lat1*Math.PI/180) *
Math.cos(lat2*Math.PI/180) *
Math.sin(dLon/2) * Math.sin(dLon/2);

const c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

return R * c;
}

buses.forEach(bus=>{

if(bus.latitude && bus.longitude){

const distance = getDistance(
lat,
lng,
bus.latitude,
bus.longitude
);

if(distance < minDistance){
minDistance = distance;
nearestBus = bus;
}

}

});

res.json({
bus:nearestBus,
distance:minDistance.toFixed(2)+" km"
});

}catch(err){
res.status(500).json({message:err.message});
}
}