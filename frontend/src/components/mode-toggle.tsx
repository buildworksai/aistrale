import { useTheme } from "./theme-provider"
import { useState, useRef, useEffect } from "react"

/**
 * Theme Toggle Component - Following Laws of UX:
 * 
 * 1. Hick's Law: Single toggle button (reduces decision time)
 * 2. Progressive Disclosure: System preference in dropdown
 * 3. Fitts's Law: Large, easy-to-click target
 * 4. Aesthetic-Usability Effect: Clean, professional icons
 * 5. Feedback: Clear visual indication of current state
 */
export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showDropdown])

    // Toggle between light and dark (most common use case)
    const handleToggle = () => {
        if (theme === 'light') {
            setTheme('dark')
        } else if (theme === 'dark') {
            setTheme('light')
        } else {
            // If system, toggle to opposite of current system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            setTheme(prefersDark ? 'light' : 'dark')
        }
    }

    // Get current effective theme for display
    const getEffectiveTheme = () => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return theme
    }

    const effectiveTheme = getEffectiveTheme()

    return (
        <div className="relative inline-flex items-center gap-2" ref={dropdownRef}>
            {/* Primary Toggle Button - Single action (Hick's Law) */}
            <button
                onClick={handleToggle}
                onMouseDown={(e) => {
                    // Prevent dropdown from closing when clicking toggle
                    e.stopPropagation()
                }}
                className={`
                    relative flex items-center justify-center
                    w-10 h-10 rounded-lg
                    bg-gray-100 dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                    hover:bg-gray-200 dark:hover:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2
                    transition-all duration-200
                    group
                `}
                aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
                title={`Current: ${effectiveTheme === 'light' ? 'Light' : 'Dark'} mode (Click to toggle)`}
            >
                {/* Light Icon */}
                <svg
                    className={`absolute w-5 h-5 text-gray-700 dark:text-gray-300 transition-all duration-300 ${
                        effectiveTheme === 'light'
                            ? 'opacity-100 rotate-0 scale-100'
                            : 'opacity-0 rotate-90 scale-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>

                {/* Dark Icon */}
                <svg
                    className={`absolute w-5 h-5 text-gray-700 dark:text-gray-300 transition-all duration-300 ${
                        effectiveTheme === 'dark'
                            ? 'opacity-100 rotate-0 scale-100'
                            : 'opacity-0 -rotate-90 scale-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>

                {/* System Indicator Badge (when system mode is active) */}
                {theme === 'system' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-info-main rounded-full border-2 border-white dark:border-gray-800" />
                )}
            </button>

            {/* Dropdown Menu - Progressive Disclosure for System Preference */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`
                    flex items-center justify-center
                    w-10 h-10 rounded-lg
                    bg-gray-100 dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                    hover:bg-gray-200 dark:hover:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2
                    transition-all duration-200
                    ${showDropdown ? 'bg-gray-200 dark:bg-gray-700' : ''}
                `}
                aria-label="Theme preferences"
                aria-expanded={showDropdown}
                title="Theme preferences"
            >
                <svg
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                        showDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 transform transition-all duration-200 origin-top-right">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Theme Preference
                        </p>
                    </div>

                    {/* Light Mode Option */}
                    <button
                        onClick={() => {
                            setTheme('light')
                            setShowDropdown(false)
                        }}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2 text-sm
                            transition-colors
                            ${theme === 'light'
                                ? 'bg-primary-main/10 text-primary-main dark:text-primary-main font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                        <span>Light</span>
                        {theme === 'light' && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                    </button>

                    {/* Dark Mode Option */}
                    <button
                        onClick={() => {
                            setTheme('dark')
                            setShowDropdown(false)
                        }}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2 text-sm
                            transition-colors
                            ${theme === 'dark'
                                ? 'bg-primary-main/10 text-primary-main dark:text-primary-main font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                            />
                        </svg>
                        <span>Dark</span>
                        {theme === 'dark' && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                    </button>

                    {/* System Mode Option */}
                    <button
                        onClick={() => {
                            setTheme('system')
                            setShowDropdown(false)
                        }}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2 text-sm
                            transition-colors
                            ${theme === 'system'
                                ? 'bg-primary-main/10 text-primary-main dark:text-primary-main font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        <span>System</span>
                        {theme === 'system' && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
