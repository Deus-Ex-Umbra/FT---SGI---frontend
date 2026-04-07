"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
    const theme = document.documentElement.classList.contains("dark") ? "dark" : "light"

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:border-slate-200 group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:shadow-lg dark:group-[.toaster]:border-slate-800 dark:group-[.toaster]:bg-slate-950 dark:group-[.toaster]:text-slate-50",
                    description: "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400",
                    actionButton: "group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 dark:group-[.toast]:bg-slate-50 dark:group-[.toast]:text-slate-900",
                    cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }