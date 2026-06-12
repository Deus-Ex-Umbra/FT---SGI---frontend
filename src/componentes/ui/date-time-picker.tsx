import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown, Clock } from "lucide-react"

import { cn } from "@/utilidades/ui"
import { Boton } from "@/componentes/ui/button"
import { Calendar } from "@/componentes/ui/calendar"
import { Input } from "@/componentes/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/componentes/ui/popover"

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  title?: string
  className?: string
  dateButtonClassName?: string
  align?: "start" | "center" | "end"
  disableDate?: boolean
  startMonth?: Date
  endMonth?: Date
}

const toDate = (value: string): Date | undefined => {
  if (!value) return undefined

  const normalized = value.includes("T") ? value : `${value}T00:00`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const getTimeString = (value: string): string => {
  if (!value || !value.includes("T")) return "09:00"
  return value.slice(11, 16) || "09:00"
}

const normalizeTimeFromInput = (raw: string): string => {
  const trimmed = String(raw ?? "").trim()
  if (!trimmed) return ""
  return trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed
}

const isValidTime = (time: string): boolean => {
  const normalized = normalizeTimeFromInput(time)
  if (!/^\d{2}:\d{2}$/.test(normalized)) return false
  const [hours, minutes] = normalized.split(":").map((segment) => Number(segment))
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

const mergeDateAndTime = (date: Date, time: string): string => {
  const [hours, minutes] = time.split(":").map((segment) => Number(segment))
  const nextDate = new Date(date)
  nextDate.setHours(hours || 0, minutes || 0, 0, 0)
  return format(nextDate, "yyyy-MM-dd'T'HH:mm")
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecciona fecha y hora",
  title,
  className,
  dateButtonClassName,
  align = "start",
  disableDate = false,
  startMonth = new Date(2000, 0),
  endMonth = new Date(2100, 11),
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = React.useMemo(() => toDate(value), [value])
  const [time, setTime] = React.useState<string>(getTimeString(value))

  const currentMonth = React.useMemo(() => {
    const base = selectedDate ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  }, [selectedDate])

  const [visibleMonth, setVisibleMonth] = React.useState<Date>(currentMonth)

  React.useEffect(() => {
    setTime(getTimeString(value))
  }, [value])

  React.useEffect(() => {
    if (open) {
      setVisibleMonth(currentMonth)
    }
  }, [open, currentMonth])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={disableDate ? false : open} onOpenChange={(nextOpen) => {
        if (disableDate) return
        setOpen(nextOpen)
      }}>
        <PopoverTrigger asChild>
          <Boton
            variant="outline"
            title={title}
            disabled={disableDate}
            className={cn(
              "h-9 flex-1 justify-between text-left font-normal transition-all duration-150 hover:border-blue-400",
              !selectedDate && "text-slate-400 dark:text-slate-500",
              dateButtonClassName,
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className={cn("h-4 w-4 transition-colors", selectedDate ? "text-primary" : "text-slate-400")} />
              {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>{placeholder}</span>}
            </div>
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
          </Boton>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150 dark:border-slate-700 dark:bg-slate-900"
          align={align}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) return
              const timeForMerge = isValidTime(time) ? normalizeTimeFromInput(time) : getTimeString(value)
              onChange(mergeDateAndTime(date, timeForMerge))
              setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
              setOpen(false)
            }}
            locale={es}
            captionLayout="dropdown"
            navLayout="around"
            startMonth={startMonth}
            endMonth={endMonth}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            className="p-2"
          />
        </PopoverContent>
      </Popover>
      <div className="flex shrink-0 flex-col items-start gap-0.5">
        <div className="relative w-[100px]">
          <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            title={title ? `${title} - hora` : "Hora"}
            aria-label={title ? `${title} - hora` : "Hora"}
            type="time"
            step={60}
            value={time}
            onChange={(event) => {
              const nextTime = normalizeTimeFromInput(event.target.value)
              setTime(nextTime)
              if (selectedDate && isValidTime(nextTime)) {
                onChange(mergeDateAndTime(selectedDate, nextTime))
              }
            }}
            onBlur={() => {
              const fallback = getTimeString(value)
              if (!isValidTime(time)) {
                setTime(fallback)
                return
              }
              if (selectedDate) {
                onChange(mergeDateAndTime(selectedDate, normalizeTimeFromInput(time)))
              }
            }}
            className="h-9 w-full appearance-none bg-background pl-8 pr-2 text-sm font-medium tabular-nums [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
      </div>
    </div>
  )
}
