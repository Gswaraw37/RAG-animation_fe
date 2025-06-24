import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

const SpeechBubble = ({
  message,
  isVisible,
  position = "right",
  onTypingComplete = () => {},
  className = "",
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  console.log("SpeechBubble render:", { message, isVisible, position });

  useEffect(() => {
    if (!isVisible || !message) {
      console.log(
        "SpeechBubble: Hiding, isVisible:",
        isVisible,
        "message:",
        message
      );
      setDisplayText("");
      setIsTyping(false);
      return;
    }

    console.log("SpeechBubble: Starting typewriter for:", message);
    setIsTyping(true);
    setDisplayText("");

    let i = 0;
    const timer = setInterval(() => {
      if (i < message.length) {
        setDisplayText((prev) => prev + message.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        onTypingComplete();
      }
    }, 50);

    return () => clearInterval(timer);
  }, [message, isVisible, onTypingComplete]);

  if (!isVisible) {
    console.log("SpeechBubble: Not visible, returning null");
    return null;
  }

  console.log("SpeechBubble: Rendering visible bubble with text:", displayText);

  return (
    <div
      className={`absolute z-20 ${
        position === "right" ? "left-full ml-6" : "right-full mr-6"
      } top-1/2 transform -translate-y-1/2 ${className}`}
    >
      <div className="relative w-80 max-w-sm">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/30 min-h-[100px]">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-gray-800 text-base leading-relaxed min-h-[20px]">
                {displayText}
                {isTyping && (
                  <span className="animate-pulse text-blue-500">|</span>
                )}
              </p>
            </div>
          </div>

          {isTyping && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span>GiziAI sedang menjelaskan...</span>
            </div>
          )}

          {!isTyping && displayText && (
            <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Bubble akan hilang dalam beberapa detik...</span>
            </div>
          )}
        </div>

        <div
          className={`absolute top-1/2 transform -translate-y-1/2 ${
            position === "right" ? "-left-2" : "-right-2"
          }`}
        >
          <div
            className={`w-4 h-4 bg-white/95 rotate-45 border ${
              position === "right"
                ? "border-r-0 border-b-0"
                : "border-l-0 border-t-0"
            } border-white/30`}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SpeechBubble;
