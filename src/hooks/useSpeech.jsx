import { createContext, useContext, useEffect, useState } from "react";
import { generateUUID } from "../utils/uuid";

const backendUrl = "http://82.112.230.106:8006";

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionUUID, setSessionUUID] = useState(null);

  const processResponseMessages = (responseMessages) => {
    return responseMessages.map((msg, index) => {
      console.log(`Processing message ${index}:`, msg);

      if (msg.audio) {
        try {
          const audioBlob = base64ToBlob(msg.audio, "audio/mpeg");
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log(`Audio URL created for message ${index}:`, audioUrl);
        } catch (error) {
          console.error(`Invalid audio data in message ${index}:`, error);
          msg.audio = null;
        }
      }

      if (msg.lipsync && !msg.lipsync.mouthCues) {
        console.warn(`Invalid lipsync data in message ${index}:`, msg.lipsync);
        msg.lipsync = createFallbackLipsync();
      }

      return {
        text: msg.text || "Response tidak tersedia",
        facialExpression: msg.facialExpression || "default",
        animation: msg.animation || "Sad",
        audio: msg.audio,
        lipsync: msg.lipsync || createFallbackLipsync(),
      };
    });
  };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const createFallbackLipsync = () => {
    return {
      metadata: {
        soundFile: "fallback.wav",
        duration: 3.0,
      },
      mouthCues: [
        { start: 0.0, end: 0.5, value: "A" },
        { start: 0.5, end: 1.0, value: "B" },
        { start: 1.0, end: 1.5, value: "C" },
        { start: 1.5, end: 2.0, value: "A" },
        { start: 2.0, end: 2.5, value: "B" },
        { start: 2.5, end: 3.0, value: "X" },
      ],
    };
  };

  const tts = async (message) => {
    if (loading || !message.trim()) return;

    console.log("Sending text message:", message);
    setLoading(true);

    try {
      const data = await fetch(`${backendUrl}/api/digital-human/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          type: "text",
          session_uuid: sessionUUID,
        }),
      });

      if (!data.ok) {
        throw new Error(`HTTP error! status: ${data.status}`);
      }

      const response = await data.json();
      console.log("Text response received:", response);

      if (response.session_uuid !== sessionUUID) {
        setSessionUUID(response.session_uuid);
      }

      const processedMessages = processResponseMessages(response.messages);
      setMessages((messages) => [...messages, ...processedMessages]);
    } catch (error) {
      console.error("Error sending text:", error);
      setMessages((messages) => [
        ...messages,
        {
          text: "Maaf, terjadi kesalahan saat memproses pesan. Silakan coba lagi.",
          facialExpression: "sad",
          animation: "Sad",
          audio: null,
          lipsync: createFallbackLipsync(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    console.log("Message played, removing from queue");
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      console.log("Setting current message:", messages[0]);
      setMessage(messages[0]);
    } else {
      console.log("No messages in queue");
      setMessage(null);
    }
  }, [messages]);

  useEffect(() => {
    if (!sessionUUID) {
      const newUUID = generateUUID();
      console.log("Generated new session UUID:", newUUID);
      setSessionUUID(newUUID);
    }
  }, []);

  return (
    <SpeechContext.Provider
      value={{
        tts,
        message,
        onMessagePlayed,
        loading,
        sessionUUID,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};
