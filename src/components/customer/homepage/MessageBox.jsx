import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send } from "lucide-react";

// ── Quick reply chips shown above the input
const QUICK_REPLIES = [
  "Need assistance please",
  "Can I get the menu?",
  "Ready to order!",
];

// ── Simulated auto-responses — remove once socket is connected
const AUTO_RESPONSES = [
  "Got it! On my way.",
  "Sure, I'll be right there!",
  "Thank you, coming shortly.",
  "Noted! Give me a moment.",
];

// Returns current time as HH:MM
const nowTime = () => {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function MessageBox({ waiter, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Seed greeting message when a new waiter is selected
  useEffect(() => {
    if (!waiter) return;
    setMessages([
      {
        from: "them",
        text: `Hi! I'm ${waiter.name}. How can I help?`,
        time: nowTime(),
      },
    ]);
    setInput("");
  }, [waiter]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed) return;

    // Append customer message immediately
    setMessages((prev) => [
      ...prev,
      { from: "me", text: trimmed, time: nowTime() },
    ]);
    setInput("");

    // ── TODO: replace with socket emit once backend is ready
    // socket.emit('send_message', {
    //   tableId, restaurantId,
    //   waiterId: waiter.id,
    //   senderId: customerId,
    //   senderRole: 'customer',
    //   text: trimmed,
    // })

    // Simulated waiter reply — remove when socket is connected
    setTimeout(
      () => {
        const reply =
          AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)];
        setMessages((prev) => [
          ...prev,
          { from: "them", text: reply, time: nowTime() },
        ]);
      },
      800 + Math.random() * 500,
    );
  };

  return (
    <AnimatePresence>
      {waiter && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl w-full max-w-xs p-5 flex flex-col gap-3 shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-lg flex-0">
                {waiter.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {waiter.name}
                </p>
                <p className="text-xs text-green-500 font-medium">Online</p>
              </div>
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
              >
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Chat area */}
            <div className="bg-gray-50 rounded-2xl p-3 h-52 overflow-y-auto flex flex-col gap-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div>
                    <div
                      className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[78%] ${
                        msg.from === "me"
                          ? "bg-orange-500 text-white rounded-br-sm"
                          : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5 text-right">
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick replies */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-400 transition-colors"
              />
              <button
                onClick={() => sendMessage()}
                className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
