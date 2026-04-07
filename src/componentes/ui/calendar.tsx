import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { es } from "date-fns/locale"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

type CalendarDropdownProps = {
  className?: string
  classNames: Record<string, string>
  components: Record<string, unknown>
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  options?: Array<{
    disabled: boolean
    label: string
    value: number
  }>
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">

function CalendarDropdown({ className, disabled, onChange, options, value }: CalendarDropdownProps) {
  const selectedValue = Array.isArray(value)
    ? String(value[0] ?? "")
    : value == null
      ? undefined
      : String(value)
  const selectedOption = options?.find((option) => String(option.value) === selectedValue)
  const isYearDropdown = className?.includes("years_dropdown") ?? false

  return (
    <div className={cn("calendar-daypicker-dropdown", className)}>
      <Select
        disabled={disabled}
        value={selectedValue}
        onValueChange={(nextValue) => {
          onChange?.({
            target: { value: nextValue },
          } as React.ChangeEvent<HTMLSelectElement>)
        }}
      >
        <SelectTrigger
          className={cn(
            "h-5.5 border-slate-300 bg-slate-100 px-1 text-[11px] font-medium shadow-none dark:border-slate-600 dark:bg-slate-800",
            isYearDropdown ? "w-[3.6rem]" : "w-[4.25rem]"
          )}
          aria-label={isYearDropdown ? "Seleccionar año" : "Seleccionar mes"}
        >
          <SelectValue>{selectedOption?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent className={cn("p-0.5", isYearDropdown ? "w-[3.6rem]" : "w-[4.25rem]")} position="popper">
          {options?.map((option) => (
            <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function Calendar({ className, classNames, showOutsideDays = true, locale = es, ...props }: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("p-3", className)}
      classNames={{
        ...defaultClassNames,
        root: cn(
          defaultClassNames.root,
          "rdp-root rounded-md bg-white text-[12px] text-slate-900 [--rdp-day-height:1.28rem] [--rdp-day-width:1.28rem] [--rdp-day_button-height:1.28rem] [--rdp-day_button-width:1.28rem] [--rdp-nav-height:1.35rem] [--rdp-nav_button-height:1rem] [--rdp-nav_button-width:1rem] [--rdp-weekday-padding:0.05rem_0] [--rdp-months-gap:0.15rem] dark:bg-slate-900 dark:text-slate-100"
        ),
        months: cn(defaultClassNames.months, "flex flex-col gap-0.5"),
        month: cn(defaultClassNames.month, "space-y-0.5"),
        month_caption: cn(defaultClassNames.month_caption, "relative flex items-center justify-center px-3 pt-0 text-[11px] font-semibold leading-none"),
        caption_label: cn(defaultClassNames.caption_label, "text-[11px] font-semibold leading-none"),
        dropdowns: cn(defaultClassNames.dropdowns, "h-5.5 items-center gap-0.5"),
        months_dropdown: cn(defaultClassNames.months_dropdown, "w-[4.25rem]"),
        years_dropdown: cn(defaultClassNames.years_dropdown, "w-[3.6rem]"),
        dropdown_root: cn(defaultClassNames.dropdown_root, "h-5.5 overflow-hidden"),
        dropdown: cn(defaultClassNames.dropdown, "h-5.5 w-full text-[11px]"),
        nav: cn(defaultClassNames.nav, "flex items-center gap-0.5"),
        button_previous:
          cn(
            defaultClassNames.button_previous,
            "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-0 text-slate-700 opacity-95 transition-opacity hover:opacity-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          ),
        button_next:
          cn(
            defaultClassNames.button_next,
            "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-0 text-slate-700 opacity-95 transition-opacity hover:opacity-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          ),
        month_grid: cn(defaultClassNames.month_grid, "w-full border-collapse"),
        weekdays: cn(defaultClassNames.weekdays, ""),
        weekday: cn(defaultClassNames.weekday, "text-[10px] font-medium leading-none text-muted-foreground"),
        week: cn(defaultClassNames.week, ""),
        day: cn(defaultClassNames.day, "p-0 text-center text-[11px] align-middle"),
        day_button:
          cn(
            defaultClassNames.day_button,
            "rounded-md p-0 text-[11px] leading-none font-medium aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground"
          ),
        selected:
          cn(
            defaultClassNames.selected,
            "bg-primary text-[11px] font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
          ),
        today: cn(defaultClassNames.today, "bg-accent text-accent-foreground"),
        outside: cn(defaultClassNames.outside, "text-muted-foreground opacity-50"),
        disabled: cn(defaultClassNames.disabled, "text-muted-foreground opacity-50"),
        hidden: cn(defaultClassNames.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
