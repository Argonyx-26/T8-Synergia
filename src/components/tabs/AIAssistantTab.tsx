import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useAppStore } from "../../store";
import { Send, Bot, User, Sparkles, PlusCircle, Wrench, RefreshCcw, AlertTriangle } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  isError?: boolean;
  toolCallsExecuted?: Array<{ name: string; args: string; result_summary: string }>;
}

export default function AIAssistantTab() {
  const token = useAppStore((state) => state.token);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello! 🌸 I'm your empathetic PCOS & Hormonal Health Companion powered by OpenAI. Ask me anything in natural language—whether you're feeling worried about irregular periods, curious about your screening score, or sharing how you feel!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "I'm scared about my irregular periods.",
    "I'm so happy! My periods have finally become regular!",
    "Explain my latest screening result",
    "Have I mentioned feeling anxious recently?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([
      {
        id: "1_" + Date.now(),
        sender: "ai",
        text: "Started a fresh conversation session! 🌸 How can I help you today?",
      },
    ]);
    setLastFailedText(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      sender: "user",
      text: messageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);
    setLastFailedText(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId,
          history: messages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await response.json();

      if (data.conversation_id) setConversationId(data.conversation_id);

      const aiMsg: ChatMessage = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: data.reply || "I'm here to support your health journey.",
        isError: !response.ok,
        toolCallsExecuted: data.tool_calls_executed || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setLastFailedText(messageText);
      const errorMsg: ChatMessage = {
        id: "ai_err_" + Date.now(),
        sender: "ai",
        text: "I couldn't reach the health backend service right now. Please verify your connection or try clicking Retry below.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Main Chat Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-4 sm:p-6 flex flex-col h-[560px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/60 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100/90 text-pink-600 flex items-center justify-center text-xl shadow-xs">
              🌸
            </div>
            <div>
              <h3 className="font-serif-title font-bold text-gray-800 text-base">
                AI Conversational Health Companion
              </h3>
              <span className="text-[10px] text-gray-400 font-medium block">
                Empathetic OpenAI Pipeline · Tool Calling · Personalized Journal Memory
              </span>
            </div>
          </div>

          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1 text-[11px] font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                m.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs ${
                  m.sender === "user"
                    ? "bg-purple-500 text-white"
                    : m.isError
                    ? "bg-amber-100 text-amber-700"
                    : "bg-pink-100 text-pink-700"
                }`}
              >
                {m.sender === "user" ? (
                  <User className="w-4 h-4" />
                ) : m.isError ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div className="space-y-1.5 max-w-[85%]">
                {/* Tool Badges if assistant executed tools */}
                {m.toolCallsExecuted && m.toolCallsExecuted.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {m.toolCallsExecuted.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full"
                      >
                        <Wrench className="w-3 h-3 text-purple-500" /> Tool: {t.name}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-tr-none shadow-xs font-normal"
                      : m.isError
                      ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none shadow-xs"
                      : "bg-white border border-pink-100 text-gray-800 rounded-tl-none shadow-xs font-normal"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 italic">
              <Bot className="w-4 h-4 animate-spin text-pink-400" /> Conversational companion is reflecting and replying...
            </div>
          )}

          {lastFailedText && !loading && (
            <div className="flex justify-center my-2">
              <button
                onClick={() => handleSendMessage(lastFailedText)}
                className="flex items-center gap-1.5 text-xs text-pink-600 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3 py-1.5 rounded-xl cursor-pointer font-semibold shadow-xs"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retry failed message
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Chips */}
        <div className="py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t border-pink-50">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-pink-50/80 hover:bg-pink-100 text-pink-700 border border-pink-200/60 whitespace-nowrap transition-all cursor-pointer shrink-0"
            >
              ✨ {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Type how you're feeling (e.g. 'I'm scared about my irregular periods')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-blush flex-1 text-xs sm:text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
