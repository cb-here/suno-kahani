import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-gray-50 to-gray-100 dark:from-[#181515] dark:via-[#0f0d0d] dark:to-[#181515] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 text-center max-w-lg">
        <div className="mb-8">
          <h1
            className="text-9xl font-black bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-bounce"
            style={{ animationDelay: "0s" }}
          >
            404
          </h1>
          <p className="text-sm tracking-widest text-gray-600 dark:text-gray-500 uppercase mt-2 font-semibold">
            Page Not Found
          </p>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          Oops! The page you're looking for seems to have wandered off into the
          digital void.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 border border-gray-400 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-600"
          >
            Go Back
          </button>
        </div>

        <div className="mt-12 flex justify-center gap-2">
          <div
            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
