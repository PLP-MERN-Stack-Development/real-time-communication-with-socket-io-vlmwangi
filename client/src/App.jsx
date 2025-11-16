import { useState } from "react";
import Chat from "./components/Chat";
import UsernamePrompt from "./components/UsernamePrompt";

export default function App() {
  const [username, setUsername] = useState("");

  if (!username) {
    return <UsernamePrompt setUsername={setUsername} />;
  }

  return <Chat username={username} />;
}
