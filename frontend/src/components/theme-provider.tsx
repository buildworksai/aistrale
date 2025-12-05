import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Helper function to validate theme value
function isValidTheme(value: string | null): value is Theme {
    return value === "dark" || value === "light" || value === "system"
}

// Helper function to get effective theme (resolves system preference)
function getEffectiveTheme(theme: Theme): "dark" | "light" {
    if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    // Initialize theme from localStorage with validation
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem(storageKey)
        return isValidTheme(stored) ? stored : defaultTheme
    })

    // Use useLayoutEffect to prevent FOUC and ensure class is applied before paint
    useLayoutEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        const effectiveTheme = getEffectiveTheme(theme)
        root.classList.add(effectiveTheme)
    }, [theme])

    // Listen to system preference changes only when theme is "system"
    useEffect(() => {
        if (theme !== "system") return

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

        const handleChange = () => {
            const root = window.document.documentElement
            const systemTheme = mediaQuery.matches ? "dark" : "light"
            root.classList.remove("light", "dark")
            root.classList.add(systemTheme)
        }

        // Apply initial system theme
        handleChange()

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [theme])

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            // Validate before setting
            if (isValidTheme(newTheme)) {
                localStorage.setItem(storageKey, newTheme)
                setTheme(newTheme)
            } else {
                console.warn(`Invalid theme value: ${newTheme}. Falling back to default.`)
                localStorage.setItem(storageKey, defaultTheme)
                setTheme(defaultTheme)
            }
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
