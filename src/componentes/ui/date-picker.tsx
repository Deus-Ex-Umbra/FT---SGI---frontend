import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
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
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = React.useMemo(() => toDate(value), [value])
  const startMonth = React.useMemo(() => new Date(2000, 0), [])
  const endMonth = React.useMemo(() => new Date(2100, 11), [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Boton
          variant="outline"
          title={title}
          className={cn(
            "w-full justify-between text-left font-normal transition-all duration-200 hover:border-blue-400",
            !selectedDate && "text-slate-500 dark:text-slate-400",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>{placeholder}</span>}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Boton>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden rounded-md border border-slate-200 bg-white p-0 text-[11px] text-slate-900 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
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
          className="p-0.5"
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
