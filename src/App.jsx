import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Scenario } from "./components/Scenario";
import { ChatInterface } from "./components/ChatInterface";
import { SpeechProvider } from "./hooks/useSpeech";

function App() {
  return (
    <SpeechProvider>
      <div className="h-screen w-screen overflow-hidden">
        <Loader />
        <Leva collapsed />
        <ChatInterface />
        <Canvas
          shadows
          camera={{ position: [0, 0, 0], fov: 10 }}
          className="w-full h-full"
        >
          <Scenario />
        </Canvas>
      </div>
    </SpeechProvider>
  );
}

export default App;
