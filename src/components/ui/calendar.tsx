
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(props.month || props.defaultMonth || new Date());

  React.useEffect(() => {
    // If a date is selected, open the calendar to that month.
    if (props.selected) {
      const selectedDate = props.selected as Date;
      if (selectedDate && (selectedDate.getMonth() !== currentMonth.getMonth() || selectedDate.getFullYear() !== currentMonth.getFullYear())) {
        setCurrentMonth(selectedDate);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selected]);
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "grid grid-cols-[auto_1fr_auto] gap-1 items-center mb-2",
        caption_label: "text-sm font-medium hidden", // We hide the default label to use dropdowns
        caption_dropdowns: "flex justify-center gap-1 col-start-2",
        nav: "space-x-1 flex items-center col-start-1 col-end-4",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "col-start-1",
        nav_button_next: "col-start-3",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground rounded-full",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Dropdown: ({ value, onChange, children, ...props }: DropdownProps) => {
            const options = React.Children.toArray(children) as React.ReactElement<React.HTMLProps<HTMLOptionElement>>[];
            const selected = options.find((child) => child.props.value === value);
            const handleChange = (value: string) => {
                const changeEvent = {
                    target: { value },
                } as React.ChangeEvent<HTMLSelectElement>;
                onChange?.(changeEvent);
            };
            return (
                 <Select
                    value={value?.toString()}
                    onValueChange={(value) => {
                        handleChange(value);
                    }}
                >
                    <SelectTrigger className="pr-1.5 focus:ring-0 h-8">
                        <SelectValue>{selected?.props?.children}</SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper">
                        <ScrollArea className="h-80">
                            {options.map((option, id: number) => (
                                <SelectItem
                                    key={`${option.props.value}-${id}`}
                                    value={option.props.value?.toString() ?? ""}
                                >
                                    {option.props.children}
                                </SelectItem>
                            ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
            )
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
