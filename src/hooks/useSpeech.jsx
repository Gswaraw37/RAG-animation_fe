import { createContext, useContext, useEffect, useState } from "react";

const backendUrl = "http://localhost:5000";

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionUUID, setSessionUUID] = useState(null);

  let chunks = [];

  const initiateRecording = () => {
    chunks = [];
  };

  const onDataAvailable = (e) => {
    chunks.push(e.data);
  };

  const sendAudioData = async (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async function () {
      const base64Audio = reader.result.split(",")[1];
      setLoading(true);

      try {
        const data = await fetch(`${backendUrl}/api/digital-human/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio_data: base64Audio,
            type: "audio",
            session_uuid: sessionUUID,
          }),
        });

        if (!data.ok) {
          throw new Error(`HTTP error! status: ${data.status}`);
        }

        const response = await data.json();

        // Update session UUID jika berbeda
        if (response.session_uuid !== sessionUUID) {
          setSessionUUID(response.session_uuid);
        }

        setMessages((messages) => [...messages, ...response.messages]);
      } catch (error) {
        console.error("Error sending audio:", error);
        // Tambahkan error message
        setMessages((messages) => [
          ...messages,
          {
            text: "Maaf, terjadi kesalahan saat memproses audio. Silakan coba lagi.",
            facialExpression: "sad",
            animation: "SadIdle",
            audio: null,
            lipsync: null,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
  };

  // Setup MediaRecorder
  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const newMediaRecorder = new MediaRecorder(stream);
          newMediaRecorder.onstart = initiateRecording;
          newMediaRecorder.ondataavailable = onDataAvailable;
          newMediaRecorder.onstop = async () => {
            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            try {
              await sendAudioData(audioBlob);
            } catch (error) {
              console.error(error);
              alert(error.message);
            }
          };
          setMediaRecorder(newMediaRecorder);
        })
        .catch((err) => console.error("Error accessing microphone:", err));
    }
  }, []);

  const startRecording = () => {
    if (mediaRecorder && !loading && !message) {
      mediaRecorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  // Text-to-Speech logic (komunikasi dengan sistem RAG)
  const tts = async (message) => {
    if (loading || !message.trim()) return;

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

      // Update session UUID jika berbeda
      if (response.session_uuid !== sessionUUID) {
        setSessionUUID(response.session_uuid);
      }

      setMessages((messages) => [...messages, ...response.messages]);
    } catch (error) {
      console.error("Error sending text:", error);
      // Tambahkan error message
      setMessages((messages) => [
        ...messages,
        {
          text: "Maaf, terjadi kesalahan saat memproses pesan. Silakan coba lagi.",
          facialExpression: "sad",
          animation: "SadIdle",
          audio: null,
          lipsync: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  // Update current message when messages array changes
  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  // Generate initial session UUID
  useEffect(() => {
    if (!sessionUUID) {
      setSessionUUID(crypto.randomUUID());
    }
  }, []);

  return (
    <SpeechContext.Provider
      value={{
        startRecording,
        stopRecording,
        recording,
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
