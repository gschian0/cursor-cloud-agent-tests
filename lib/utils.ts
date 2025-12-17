import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatDateRange(start: Date, end: Date): string {
  const isSameDay = start.toDateString() === end.toDateString()
  
  if (isSameDay) {
    return `${new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(start)} ${new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
    }).format(start)} - ${new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
    }).format(end)}`
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`
}
