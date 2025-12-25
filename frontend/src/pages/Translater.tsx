// @ts-nocheck
import { useEffect, useState } from "react";
import Button from "../components/form/Button";
import TextArea from "../components/form/TextArea";

export default function Translater() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Google Widget Init
  const googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  useEffect(() => {
    const addScript = document.createElement("script");
    addScript.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = googleTranslateElementInit;
  }, []);

  const handleCopied = async () => {
    const translatedNode = document.querySelector("#translated_output");

    if (!translatedNode) return;

    const finalText = translatedNode.innerText;

    try {
      await navigator.clipboard.writeText(finalText);
      setIsCopied(true);
    } catch (err) {
      console.log(err);
    } finally {
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleTranslate = () => {
    if (!text.trim()) return;

    setLoading(true);

    setTimeout(() => {
      setOutput(text);

      setTimeout(() => {
        const body = document.querySelector("body");
        const event = document.createEvent("HTMLEvents");
        event.initEvent("DOMNodeInserted", true, true);
        body.dispatchEvent(event);
      }, 50);

      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center py-6 px-3 sm:px-6 md:px-10">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 sm:p-6 md:p-8 space-y-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
          React Google Widget Translator
        </h1>

        {/* Widget Dropdown */}
        <div
          id="google_translate_element"
          className=" rounded-xl
             border border-gray-200/70 dark:border-gray-700/60
             bg-white/70 dark:bg-gray-900/60
             backdrop-blur-md
             px-4 py-2.5
             shadow-sm
             transition-all duration-200
             hover:shadow-md
             hover:border-gray-300 dark:hover:border-gray-600"
        ></div>

        <TextArea
          placeholder="Type text here..."
          value={text}
          rows={8}
          onChange={(e) => setText(e.target.value)}
          className="resize-auto w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 sm:p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />

        <Button
          onClick={handleTranslate}
          disabled={!text.trim()}
          className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold transition text-sm sm:text-base
          ${
            !text.trim()
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
        >
          {loading ? "Translating..." : "Translate"}
        </Button>

        {output && (
          <div className="relative border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6">
            <button
              onClick={handleCopied}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {isCopied ? "Copied!" : "Copy"}
            </button>

            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
              Translated Output
            </h3>

            <div
              id="translated_output"
              style={{ whiteSpace: "pre-wrap" }}
              className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-sm sm:text-base"
            >
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
