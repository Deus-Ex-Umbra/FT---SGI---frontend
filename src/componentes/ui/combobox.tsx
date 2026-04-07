"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverAnchor, PopoverContent } from "@/componentes/ui/popover"

type ComboboxOption = string | { value: string; label: string }

interface ComboboxContextValue<T extends ComboboxOption> {
    items: readonly T[]
    open: boolean
    setOpen: (open: boolean) => void
    value: string
    setValue: (value: string) => void
    query: string
    setQuery: (query: string) => void
    filteredItems: readonly T[]
    getItemValue: (item: T) => string
    getItemLabel: (item: T) => string
}

const ComboboxContext = React.createContext<ComboboxContextValue<any> | null>(null)

const useComboboxContext = <T extends ComboboxOption>() => {
    const context = React.useContext(ComboboxContext)
    if (!context) {
        throw new Error("Combobox components must be used within Combobox")
    }
    return context as ComboboxContextValue<T>
}

interface ComboboxProps<T extends ComboboxOption> {
    items: readonly T[]
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    getItemValue?: (item: T) => string
    getItemLabel?: (item: T) => string
    children: React.ReactNode
}

function Combobox<T extends ComboboxOption>({
    items,
    value,
    defaultValue,
    onValueChange,
    getItemValue,
    getItemLabel,
    children,
}: ComboboxProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "")
    const [query, setQuery] = React.useState("")

    const resolvedValue = value ?? uncontrolledValue

    const readItemValue = React.useCallback((item: T) => {
        if (getItemValue) return getItemValue(item)
        return typeof item === "string" ? item : item.value
    }, [getItemValue])

    const readItemLabel = React.useCallback((item: T) => {
        if (getItemLabel) return getItemLabel(item)
        return typeof item === "string" ? item : item.label
    }, [getItemLabel])

    const filteredItems = React.useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return items

        return items.filter((item) => {
            const itemValue = readItemValue(item).toLowerCase()
            const itemLabel = readItemLabel(item).toLowerCase()
            return itemValue.includes(normalized) || itemLabel.includes(normalized)
        })
    }, [items, query, readItemLabel, readItemValue])

    const setResolvedValue = React.useCallback((nextValue: string) => {
        if (value === undefined) {
            setUncontrolledValue(nextValue)
        }
        onValueChange?.(nextValue)
    }, [onValueChange, value])

    const handleOpenChange = React.useCallback((nextOpen: boolean) => {
        setOpen(nextOpen)
        if (!nextOpen) {
            setQuery("")
        }
    }, [])

    return (
        <ComboboxContext.Provider
            value={{
                items,
                open,
                setOpen: handleOpenChange,
                value: resolvedValue,
                setValue: setResolvedValue,
                query,
                setQuery,
                filteredItems,
                getItemValue: readItemValue,
                getItemLabel: readItemLabel,
            }}
        >
            <Popover open={open} onOpenChange={handleOpenChange}>
                {children}
            </Popover>
        </ComboboxContext.Provider>
    )
}

interface ComboboxInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> {
    placeholder?: string
    showClear?: boolean
}

function ComboboxInput<T extends ComboboxOption>({
    className,
    placeholder,
    showClear = false,
    ...props
}: ComboboxInputProps) {
    const { items, open, setOpen, value, setValue, query, setQuery, filteredItems, getItemValue, getItemLabel } = useComboboxContext<T>()

    const selectedItem = React.useMemo(
        () => items.find((item) => getItemValue(item) === value),
        [getItemValue, items, value]
    )

    const displayValue = open ? query : selectedItem ? getItemLabel(selectedItem) : ""

    return (
        <PopoverAnchor asChild>
            <div className="relative w-full">
                <input
                    {...props}
                    value={displayValue}
                    placeholder={placeholder}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onChange={(event) => {
                        if (!open) setOpen(true)
                        setQuery(event.target.value)
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setOpen(false)
                        }
                        if (event.key === "Enter" && filteredItems.length === 1) {
                            event.preventDefault()
                            const firstItem = filteredItems[0]
                            setValue(getItemValue(firstItem))
                            setOpen(false)
                        }
                    }}
                    className={cn(
                        "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 pr-16 text-sm text-slate-800 outline-none ring-offset-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400",
                        className
                    )}
                />
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 text-slate-400">
                    {open ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                {showClear && value && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation()
                            setValue("")
                            setQuery("")
                        }}
                        className="absolute inset-y-0 right-8 flex items-center text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label="Limpiar selección"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </PopoverAnchor>
    )
}

function ComboboxContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <PopoverContent
            align="start"
            className={cn(
                "z-[10050] w-[var(--radix-popover-trigger-width)] border-slate-200 bg-white p-1 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                className
            )}
        >
            <div className="space-y-1">{children}</div>
        </PopoverContent>
    )
}

function ComboboxEmpty<T extends ComboboxOption>({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
    const { filteredItems } = useComboboxContext<T>()
    if (filteredItems.length > 0) return null

    return <div className={cn("px-2 py-3 text-sm text-slate-500 dark:text-slate-400", className)}>{children}</div>
}

interface ComboboxListProps<T extends ComboboxOption> {
    children: (item: T) => React.ReactNode
    className?: string
}

function ComboboxList<T extends ComboboxOption>({ children, className }: ComboboxListProps<T>) {
    const { filteredItems } = useComboboxContext<T>()

    return (
        <div className={cn("max-h-64 overflow-y-auto", className)}>
            {filteredItems.map((item) => children(item))}
        </div>
    )
}

interface ComboboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
}

function ComboboxItem<T extends ComboboxOption>({ value, className, children, ...props }: ComboboxItemProps) {
    const { value: selectedValue, setValue, setOpen } = useComboboxContext<T>()
    const isSelected = selectedValue === value

    return (
        <button
            type="button"
            onClick={() => {
                setValue(value)
                setOpen(false)
            }}
            className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                className
            )}
            {...props}
        >
            <span className="truncate">{children}</span>
            <Check className={cn("h-4 w-4 text-blue-600", isSelected ? "opacity-100" : "opacity-0")} />
        </button>
    )
}

export {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
}