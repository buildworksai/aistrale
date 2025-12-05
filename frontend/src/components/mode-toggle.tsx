import { useTheme } from "./theme-provider"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="relative inline-block text-left">
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                <button
                    onClick={() => setTheme("light")}
                    className={`p-1.5 rounded-md transition-colors ${theme === "light"
                            ? "bg-gray-100 text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        }`}
                    title="Light"
                >
                    <span className="sr-only">Light</span>
                    ☀️
                </button>
                <button
                    onClick={() => setTheme("dark")}
                    className={`p-1.5 rounded-md transition-colors ${theme === "dark"
                            ? "bg-gray-700 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        }`}
                    title="Dark"
                >
                    <span className="sr-only">Dark</span>
                    🌙
                </button>
                <button
                    onClick={() => setTheme("system")}
                    className={`p-1.5 rounded-md transition-colors ${theme === "system"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        }`}
                    title="System"
                >
                    <span className="sr-only">System</span>
                    🖥️
                </button>
            </div>
        </div>
    )
}
