import { useState } from "react";

export default function UsernamePrompt({ setUsername }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setUsername(input.trim());
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Enter your username</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: "10px", marginTop: "1rem", width: "200px" }}
        />
        <button style={{ padding: "10px", marginLeft: "1rem" }}>
          Join Chat
        </button>
      </form>
    </div>
  );
}
