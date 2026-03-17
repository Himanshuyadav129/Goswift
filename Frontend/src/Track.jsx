import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";
const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL);
// backend url
const API_URL = "https://goswift-sudx.onrender.com";

// socket create
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("API URL missing");
}
const socket = io(API_URL);

// 🚌 Bus Icon
const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61231.png",
  iconSize: [32, 32],
});

// Route line
const route = [
  [28.6139, 77.2090],
  [28.6170, 77.2130],
  [28.6200, 77.2150],
  [28.6230, 77.2180],
  [28.6260, 77.2220],
  [28.6300, 77.2250],
  [28.6330, 77.2280],
  [28.6350, 77.2300],
];

const Track = () => {

  const [busPositions, setBusPositions] = useState([]);

  // fetch buses
  useEffect(() => {

    const fetchBuses = async () => {

      try {

        const res = await axios.get(`${API_URL}/bus/all`);

        setBusPositions(res.data);

      } catch (err) {
        console.log("Bus fetch error:", err);
      }

    };

    fetchBuses();

  }, []);

  // socket live update
  useEffect(() => {

    socket.on("busLocationUpdate", (data) => {

      setBusPositions(prev => {

        const updated = prev.map(bus =>

          bus._id === data.busId
            ? {
                ...bus,
                latitude: data.latitude,
                longitude: data.longitude
              }
            : bus
        );

        return updated;

      });

    });

    return () => socket.off("busLocationUpdate");

  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-8">

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl font-bold text-sky-400">
          GoSwift Live Transport Monitoring
        </h1>
        <p className="text-slate-400 mt-2">
          Real-time route tracking & fleet visibility system
        </p>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto h-[550px] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/5 border border-white/10">

        <MapContainer
          center={route[0]}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >

          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route line */}
          <Polyline
            positions={route}
            pathOptions={{ color: "#0ea5e9", weight: 6 }}
          />

          {/* Live buses */}
          {busPositions.map(bus => (

            bus.latitude && bus.longitude && (

              <Marker
                key={bus._id}
                position={[bus.latitude, bus.longitude]}
                icon={busIcon}
              >
                <Popup>
                  <div>
                    <strong>Bus {bus.busNumber}</strong>
                    <br/>
                    Driver: {bus.driverName}
                    <br/>
                    Status: Running
                  </div>
                </Popup>
              </Marker>

            )

          ))}

        </MapContainer>

      </div>

      {/* Fleet Panel */}
      <div className="max-w-7xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <h3 className="text-sky-400 font-semibold text-lg">
            Active Fleet
          </h3>
          <p className="text-3xl font-bold mt-3">
            {busPositions.length}
          </p>
          <p className="text-slate-400 mt-2">
            Vehicles currently operational
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <h3 className="text-sky-400 font-semibold text-lg">
            Route Coverage
          </h3>
          <p className="text-3xl font-bold mt-3">
            18 KM
          </p>
          <p className="text-slate-400 mt-2">
            Total monitored corridor
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <h3 className="text-sky-400 font-semibold text-lg">
            System Status
          </h3>
          <p className="text-3xl font-bold mt-3 text-green-400">
            LIVE
          </p>
          <p className="text-slate-400 mt-2">
            Monitoring active in real-time
          </p>
        </div>

      </div>

    </div>
  );
};

export default Track;