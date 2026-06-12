import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/utilidades/ui"
import { Boton } from "@/componentes/ui/button"
import { Calendar } from "@/componentes/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/componentes/ui/popover"

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  title?: string
  className?: string
  align?: "start" | "center" | "end"
  startMonth?: Date
  endMonth?: Date
}

const toDate = (value: string): Date | undefined => {
  if (!value) return undefined

  const [year, month, day] = value.split("-").map((segment) => Number(segment))
  if (!year || !month || !day) return undefined

  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  title,
  className,
  align = "start",
  startMonth = new Date(2000, 0),
  endMonth = new Date(2100, 11),
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = React.useMemo(() => toDate(value), [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Boton
          variant="outline"
          title={title}
          className={cn(
            "h-9 w-full justify-between text-left font-normal transition-all duration-150 hover:border-blue-400",
            !selectedDate && "text-slate-400 dark:text-slate-500",
            className
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
          captionLayout="dropdown"
          navLayout="around"
          startMonth={startMonth}
          endMonth={endMonth}
          className="p-2"
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "")
            if (date) {
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
