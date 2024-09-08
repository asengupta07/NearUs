"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TimePicker({ date, setDate }: { date: Date | undefined, setDate: (date: Date) => void }) {
  const minuteRef = React.useRef<HTMLInputElement>(null)
  const hourRef = React.useRef<HTMLInputElement>(null)
  const [selectedPeriod, setSelectedPeriod] = React.useState<"AM" | "PM">("AM")

  const handleTimeChange = (newHour: number, newMinute: number) => {
    const newDate = new Date()
    newDate.setHours(selectedPeriod === "PM" ? newHour + 12 : newHour)
    newDate.setMinutes(newMinute)
    setDate(newDate)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span>Pick a time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center space-x-2 p-3">
          <Input
            ref={hourRef}
            className="w-[50px]"
            placeholder="HH"
            onChange={(e) => handleTimeChange(parseInt(e.target.value) || 0, parseInt(minuteRef.current?.value || "0"))}
          />
          <span>:</span>
          <Input
            ref={minuteRef}
            className="w-[50px]"
            placeholder="MM"
            onChange={(e) => handleTimeChange(parseInt(hourRef.current?.value || "0"), parseInt(e.target.value) || 0)}
          />
          <Select
            value={selectedPeriod}
            onValueChange={(value) => setSelectedPeriod(value as "AM" | "PM")}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}