import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import type { DropdownProps } from "react-day-picker"
import { es } from "date-fns/locale"
import "react-day-picker/dist/style.css"

import { cn } from "@/utilidades/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/componentes/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CalendarDropdown({ className, disabled, onChange, options, value }: DropdownProps) {
  const selectedValue = Array.isArray(value)
    ? String(value[0] ?? "")
    : value == null
      ? ""
      : String(value)

  const isYearDropdown = options && options.length > 0 && options[0].value > 31

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      const mockEvent = {
        target: {
          value: newValue,
          name: isYearDropdown ? "years" : "months",
        },
      } as unknown as React.ChangeEvent<HTMLSelectElement>
      onChange?.(mockEvent)
    },
    [onChange, isYearDropdown]
  )

  const currentOption = options?.find((opt) => String(opt.value) === selectedValue)

  return (
    <div 
      className={cn("calendar-daypicker-dropdown relative", isYearDropdown ? "w-[5.8rem]" : "w-[6.8rem]", className)}
    >
      <Select
        value={selectedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "h-7 w-full border border-slate-350 dark:border-slate-650 bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 focus:ring-1 focus:ring-slate-400",
            "text-[12px] font-semibold text-slate-700 dark:text-slate-100 rounded-md px-1.5 shadow-sm gap-1"
          )}
        >
          <SelectValue placeholder={selectedValue}>
            {currentOption?.label ?? selectedValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          className={cn(
            "max-h-[160px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-md z-[10060]",
            isYearDropdown ? "w-[5.8rem]" : "w-[6.8rem]"
          )}
        >
          {options?.map((option) => (
            <SelectItem
              key={option.value}
              value={String(option.value)}
              disabled={option.disabled}
              className="text-[12px] py-1 pl-6 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
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
          "rdp-root rounded-xl bg-white text-[13px] text-slate-900 [--rdp-day-height:2rem] [--rdp-day-width:2rem] [--rdp-day_button-height:2rem] [--rdp-day_button-width:2rem] [--rdp-nav-height:1.75rem] [--rdp-nav_button-height:1.4rem] [--rdp-nav_button-width:1.4rem] [--rdp-weekday-padding:0.15rem_0] [--rdp-months-gap:0.25rem] dark:bg-slate-900 dark:text-slate-100"
        ),
        months: cn(defaultClassNames.months, "flex flex-col gap-1"),
        month: cn(defaultClassNames.month, "space-y-2"),
        month_caption: cn(
          defaultClassNames.month_caption,
          "relative flex items-center justify-center px-2 pb-1 pt-0"
        ),
        caption_label: cn(defaultClassNames.caption_label, "text-[13px] font-semibold text-slate-800 dark:text-slate-100"),
        dropdowns: cn(defaultClassNames.dropdowns, "h-7 flex items-center gap-1"),
        months_dropdown: cn(defaultClassNames.months_dropdown, "w-[6.5rem] max-w-[6.5rem]"),
        years_dropdown: cn(defaultClassNames.years_dropdown, "w-[5.5rem] max-w-[5.5rem]"),
        dropdown_root: cn(defaultClassNames.dropdown_root, "h-7 overflow-visible"),
        dropdown: cn(defaultClassNames.dropdown, "h-7 w-full text-[13px]"),
        nav: cn(defaultClassNames.nav, "flex items-center gap-1"),
        button_previous: cn(
          defaultClassNames.button_previous,
          "inline-flex items-center justify-center rounded-md border-0 bg-transparent p-0 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        ),
        button_next: cn(
          defaultClassNames.button_next,
          "inline-flex items-center justify-center rounded-md border-0 bg-transparent p-0 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        ),
        month_grid: cn(defaultClassNames.month_grid, "w-full border-collapse"),
        weekdays: cn(defaultClassNames.weekdays, ""),
        weekday: cn(
          defaultClassNames.weekday,
          "pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500"
        ),
        week: cn(defaultClassNames.week, ""),
        day: cn(defaultClassNames.day, "p-0 text-center text-[13px] align-middle"),
        day_button: cn(
          defaultClassNames.day_button,
          "rounded-lg p-0 text-[13px] font-medium text-slate-800 transition-colors duration-100 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        ),
        selected: cn(
          defaultClassNames.selected,
          "!scale-100 rounded-lg !bg-indigo-600 !text-white [&>button]:!bg-indigo-600 [&>button]:!text-white [&>button]:!ring-0 [&>button]:!outline-none [&>button]:hover:!bg-indigo-700 dark:!bg-indigo-500 dark:[&>button]:!bg-indigo-500 dark:[&>button]:!text-white"
        ),
        today: cn(
          defaultClassNames.today,
          "rounded-lg bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-slate-100"
        ),
        outside: cn(defaultClassNames.outside, "text-slate-300 opacity-60 dark:text-slate-600"),
        disabled: cn(defaultClassNames.disabled, "text-slate-300 opacity-40 dark:text-slate-600"),
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
