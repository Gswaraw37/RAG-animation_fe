import { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { useSpeech } from "../hooks/useSpeech";
import SpeechBubble from "./SpeechBubble";

export const ChatInterface = ({ hidden, ...props }) => {
  const input = useRef();
  const [inputText, setInputText] = useState("");
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState("");
  const [bubbleTimer, setBubbleTimer] = useState(null);

  const { tts, loading, message, sessionUUID } = useSpeech();

  useEffect(() => {
    if (message && message.text) {
      console.log("Showing speech bubble for message:", message.text);
      setSpeechBubbleText(message.text);
      setShowSpeechBubble(true);

      if (bubbleTimer) {
        clearTimeout(bubbleTimer);
      }

      const timer = setTimeout(() => {
        setShowSpeechBubble(false);
        setSpeechBubbleText("");
      }, 100000);

      setBubbleTimer(timer);
    }
  }, [message]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!loading && !message && text) {
      setShowSpeechBubble(false);
      setSpeechBubbleText("");
      if (bubbleTimer) {
        clearTimeout(bubbleTimer);
      }

      tts(text);
      setInputText("");
      if (input.current) {
        input.current.value = "";
      }
    }
  };

  useEffect(() => {
    return () => {
      if (bubbleTimer) {
        clearTimeout(bubbleTimer);
      }
    };
  }, [bubbleTimer]);

  const sendMessage = () => {
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onSpeechBubbleComplete = () => {
    console.log("Speech bubble typing completed");
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
      <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg pointer-events-auto">
        <h1 className="font-black text-xl text-gray-700">
          GiziAI Digital Human
        </h1>
        <p className="text-gray-600">
          {loading
            ? "Sedang memproses..."
            : "Ketik pesan untuk berbicara dengan Gizi AI."}
        </p>
        {sessionUUID && (
          <p className="text-xs text-gray-400 mt-1">
            Sesi: {sessionUUID.slice(0, 8)}...
          </p>
        )}
      </div>

      <div className="absolute top-1/3 right-8 pointer-events-none z-30">
        <SpeechBubble
          message={speechBubbleText}
          isVisible={showSpeechBubble && !!speechBubbleText}
          position="left"
          onTypingComplete={onSpeechBubbleComplete}
        />
      </div>

      <div className="w-full flex flex-col items-end justify-center gap-4">
        {loading && (
          <div className="backdrop-blur-md bg-blue-500 bg-opacity-80 text-white p-3 rounded-lg pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Memproses respons...</span>
            </div>
          </div>
        )}

        {message && (
          <div className="backdrop-blur-md bg-green-500 bg-opacity-80 text-white p-3 rounded-lg pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-2 w-2 bg-white rounded-full"></div>
              <span>Sedang berbicara...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
        <textarea
          className="flex-1 placeholder:text-gray-800 placeholder:italic p-1 rounded-md bg-opacity-50 bg-white backdrop-blur-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-opacity-70 transition-all duration-200"
          placeholder="Ketik pertanyaan tentang gizi dan kesehatan..."
          ref={input}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={2}
          disabled={loading || message}
        />

        <button
          disabled={loading || message || !inputText.trim()}
          onClick={sendMessage}
          className={`bg-blue-500 hover:bg-blue-600 text-white p-4 px-8 font-semibold uppercase rounded-md transition-all duration-200 ${
            loading || message || !inputText.trim()
              ? "cursor-not-allowed opacity-30"
              : "hover:scale-105 hover:shadow-lg"
          }`}
        >
          Kirim
        </button>
      </div>
    </div>
  );
};
