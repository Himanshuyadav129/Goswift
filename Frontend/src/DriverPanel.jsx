import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL);

const DriverPanel = () => {

  const [busId, setBusId] = useState(null);
  const [location, setLocation] = useState(null);

  // 🔥 Get Driver Bus
  useEffect(() => {
    const driverId = localStorage.getItem("userId");

    fetch(`${API_URL}/api/driver-bus/${driverId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setBusId(data._id);
        }
      });
  }, []);

  // 🔥 Send Location
  useEffect(() => {

    if (!busId) return;

    const interval = setInterval(() => {

      navigator.geolocation.getCurrentPosition((pos) => {

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({ lat, lng });

        socket.emit("busLocation", {
          busId,
          latitude: lat,
          longitude: lng
        });

      });

    }, 5000);

    return () => clearInterval(interval);

  }, [busId]);

  return (
    <div>
      <h2>Driver Panel</h2>

      <p>Bus ID: {busId}</p>

      <p>
        Location: {location ? `${location.lat}, ${location.lng}` : "Fetching..."}
      </p>
    </div>
  );
};

export default DriverPanel;