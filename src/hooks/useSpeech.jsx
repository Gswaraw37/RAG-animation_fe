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
        console.log("Sending audio data to backend...");
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
        console.log("Audio response received:", response);

        // Update session UUID jika berbeda
        if (response.session_uuid !== sessionUUID) {
          setSessionUUID(response.session_uuid);
        }

        // Process response messages
        const processedMessages = processResponseMessages(response.messages);
        setMessages((messages) => [...messages, ...processedMessages]);
      } catch (error) {
        console.error("Error sending audio:", error);
        // Tambahkan error message
        setMessages((messages) => [
          ...messages,
          {
            text: "Maaf, terjadi kesalahan saat memproses audio. Silakan coba lagi.",
            facialExpression: "sad",
            animation: "Sad",
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

  // Process response messages untuk memastikan format yang benar
  const processResponseMessages = (responseMessages) => {
    return responseMessages.map((msg, index) => {
      console.log(`Processing message ${index}:`, msg);

      // Validate audio data
      if (msg.audio) {
        try {
          // Test if audio data is valid base64
          const audioBlob = base64ToBlob(msg.audio, "audio/mpeg");
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log(`Audio URL created for message ${index}:`, audioUrl);
        } catch (error) {
          console.error(`Invalid audio data in message ${index}:`, error);
          msg.audio = null;
        }
      }

      // Validate lipsync data
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

  // Helper function untuk convert base64 ke blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Create fallback lipsync data
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

  // Text-to-Speech logic (komunikasi dengan sistem RAG)
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

      // Update session UUID jika berbeda
      if (response.session_uuid !== sessionUUID) {
        setSessionUUID(response.session_uuid);
      }

      // Process response messages
      const processedMessages = processResponseMessages(response.messages);
      setMessages((messages) => [...messages, ...processedMessages]);
    } catch (error) {
      console.error("Error sending text:", error);
      // Tambahkan error message
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

  // Update current message when messages array changes
  useEffect(() => {
    if (messages.length > 0) {
      console.log("Setting current message:", messages[0]);
      setMessage(messages[0]);
    } else {
      console.log("No messages in queue");
      setMessage(null);
    }
  }, [messages]);

  // Generate initial session UUID
  useEffect(() => {
    if (!sessionUUID) {
      const newUUID = crypto.randomUUID();
      console.log("Generated new session UUID:", newUUID);
      setSessionUUID(newUUID);
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
