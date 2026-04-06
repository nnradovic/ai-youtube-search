import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import "./index.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_VIDEO_ID = "lfkjm2YRG-Q";
const DEFAULT_THREAD_ID = "1";
const INITIAL_ASSISTANT_MESSAGE =
  "Ask a question about the video and I'll answer using the transcript.";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const [query, setQuery] = useState("");
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID);
  const [threadId, setThreadId] = useState(DEFAULT_THREAD_ID);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const sendMessage = async () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuery,
    };

    setMessages((current) => [...current, userMessage]);
    setQuery("");
    setError("");
    setIsLoading(true);

    try {
      const backendUrl =
        import.meta.env.MODE === "production"
          ? import.meta.env.VITE_BACKEND_URL_PROD
          : import.meta.env.VITE_BACKEND_URL_DEV;

      const response = await fetch(`${backendUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: trimmedQuery,
          video_id: videoId.trim() || DEFAULT_VIDEO_ID,
          thread_id: threadId.trim() || DEFAULT_THREAD_ID,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const content = await response.text();

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: content.trim() || "No response received.",
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I couldn't reach the server. Check that the backend is running and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await sendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: INITIAL_ASSISTANT_MESSAGE,
      },
    ]);
    setQuery("");
    setError("");
    setIsLoading(false);
    setThreadId(crypto.randomUUID());
    inputRef.current?.focus();
  };

  return (
    <main className="app-shell">
      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">AI Chat App</p>
            <h1>Youtube assistant</h1>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleNewChat}
              disabled={isLoading}
            >
              New chat
            </button>
          </div>
        </header>

        <div className="toolbar">
          <label>
            <span>Video ID</span>
            <input
              value={videoId}
              onChange={(event) => setVideoId(event.target.value)}
              placeholder="lfkjm2YRG-Q"
            />
          </label>

          <label>
            <span>Thread ID</span>
            <input
              value={threadId}
              onChange={(event) => setThreadId(event.target.value)}
              placeholder="1"
            />
          </label>
        </div>

        <div className="messages" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`message message-${message.role}`}
            >
              <div className="message-meta">
                {message.role === "user" ? "You" : "Assistant"}
              </div>
              <p>{message.content}</p>
            </article>
          ))}

          {isLoading ? (
            <article className="message message-assistant message-loading">
              <div className="message-meta">Assistant</div>
              <p>Thinking...</p>
            </article>
          ) : null}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="composer-input">
            <span className="sr-only">Your message</span>
            <textarea
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about the video transcript..."
              rows={4}
            />
          </label>

          <div className="composer-footer">
            <div className="status-line">
              {error ? <span className="error-text">{error}</span> : null}
              {!error ? (
                <span>Press Enter to send, Shift+Enter for a new line.</span>
              ) : null}
            </div>

            <button type="submit" disabled={isLoading || !query.trim()}>
              <span>Send</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3.4 20.4 21 12 3.4 3.6l1.9 6.7L14 12l-8.7 1.7-1.9 6.7Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
