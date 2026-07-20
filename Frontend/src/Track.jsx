import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const UserTracking = () => {

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [buses, setBuses] = useState([]);

  const searchBus = async () => {

    const res = await fetch(`${API_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ source, destination })
    });

    const data = await res.json();
    setBuses(data);
  };

  return (
    <div>
      <h2>Track Bus</h2>

      <input placeholder="Source" onChange={e => setSource(e.target.value)} />
      <input placeholder="Destination" onChange={e => setDestination(e.target.value)} />

      <button onClick={searchBus}>Search</button>

      <ul>
        {buses.map(bus => (
          <li key={bus._id}>
            {bus.busNumber} - {bus.source} → {bus.destination}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserTracking;