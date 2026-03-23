import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const Admin = () => {

  const [busNumber, setBusNumber] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [driverId, setDriverId] = useState("");

  const handleAddBus = async () => {

    const res = await fetch(`${API_URL}/api/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        busNumber,
        source,
        destination,
        driverId
      })
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <div>
      <h2>Admin Panel</h2>

      <input placeholder="Bus Number" onChange={e => setBusNumber(e.target.value)} />
      <input placeholder="Source" onChange={e => setSource(e.target.value)} />
      <input placeholder="Destination" onChange={e => setDestination(e.target.value)} />
      <input placeholder="Driver ID" onChange={e => setDriverId(e.target.value)} />

      <button onClick={handleAddBus}>Add Bus</button>
    </div>
  );
};

export default Admin;