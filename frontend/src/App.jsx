import { useState } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setUploadMsg("Select a PDF first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5050/api/upload", formData);
      setUploadMsg(res.data.message);
    } catch (error) {
      console.error(error);
      setUploadMsg("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage = { type: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5050/api/ask", {
        question,
      });

      const botMessage = { type: "bot", text: res.data.answer };

      setMessages((prev) => [...prev, botMessage]);
      setQuestion("");
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error getting answer" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">

        <h1 className="text-3xl font-bold text-center text-black">
          📄 PDF Chatbot
        </h1>

        {/* Upload */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-3 text-black">Upload PDF</h2>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-3 block w-full text-black"
          />

          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Upload
          </button>

          {uploadMsg && (
            <p className="mt-2 text-sm text-gray-700">{uploadMsg}</p>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white p-5 rounded-xl shadow flex flex-col h-[400px]">
          <h2 className="font-semibold mb-3 text-black">Ask Question</h2>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.type === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <p className="text-sm text-gray-500">Thinking...</p>
            )}
          </div>

          {/* Input */}
          <div>
            <textarea
              rows="2"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask something about the uploaded PDF..."
              className="w-full border rounded p-2 mb-2 text-black"
            />

            <button
              onClick={handleAsk}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Ask
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}