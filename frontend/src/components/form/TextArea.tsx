import { type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "bordered";
}

export default function TextArea({
  label,
  error,
  helperText,
  variant = "default",
  className = "",
  ...props
}: TextAreaProps) {
  const baseClasses =
    "w-full px-4 py-3 font-fredoka rounded-lg transition-all duration-300 focus:outline-none resize-none";

  const variantClasses = {
    default:
      "bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:shadow-lg focus:shadow-purple-500/20",
    bordered:
      "bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30",
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`${baseClasses} ${variantClasses[variant]} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-600 dark:text-red-500 text-sm font-medium mt-2">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-gray-600 dark:text-gray-500 text-sm mt-2">{helperText}</p>
      )}
    </div>
  );
}
