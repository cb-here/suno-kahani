"use client";
import { useEffect, useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }, []);

  const handleCopy = async () => {
    const node = document.querySelector("#translated_output");
    if (!node) return;

    const finalText = node.innerText;

    try {
      await navigator.clipboard.writeText(finalText);
      setIsCopied(true);
    } catch (err) {
      console.log(err);
    } finally {
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

  // Translate using widget
  const handleTranslate = () => {
    if (!text.trim()) return;

    setLoading(true);

    setTimeout(() => {
      setOutput(text);

      // Force widget to re-translate
      setTimeout(() => {
        const evt = document.createEvent("HTMLEvents");
        evt.initEvent("DOMNodeInserted", true, true);
        document.body.dispatchEvent(evt);
      }, 50);

      setLoading(false);
    }, 200);
  };

  return (
    <div className="main-wrapper">
      <h1>React Google Widget Translator</h1>

      {/* Widget Dropdown */}
      <div id="google_translate_element"></div>

      {/* INPUT */}
      <textarea
        placeholder="Type text here..."
        value={text}
        rows={10}
        onChange={(e) => setText(e.target.value)}
      ></textarea>

      {/* TRANSLATE BUTTON */}
      <button
        onClick={handleTranslate}
        disabled={!text.trim()}
        className="translate-btn"
      >
        {loading ? "Translating..." : "Translate"}
      </button>

      
      {output && (
        <div className="output-box">
          <button onClick={handleCopy} className="copy-btn">
            {isCopied ? "Copied!" : "Copy"}
          </button>

          <h3>Translated Output</h3>

          <div id="translated_output">{output}</div>
        </div>
      )}
    </div>
  );
}
