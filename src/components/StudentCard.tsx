import React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"
import { Badge } from "./ui/badge"

interface StudentInfo {
  id: string
  name: string
  email: string
  program: string
  year: number
  status: "Active" | "On Leave" | "Graduated"
  gpa: number
  avatar?: string
}

interface StudentCardProps {
  student: StudentInfo
}

export function StudentCard({ student }: StudentCardProps) {
  const getStatusVariant = (status: StudentInfo["status"]) => {
    switch (status) {
      case "Active":
        return "success"
      case "On Leave":
        return "secondary"
      case "Graduated":
        return "default"
    }
  }

  return (
    <HoverCard>
      <HoverCardTrigger className="inline-flex items-center gap-2 rounded-lg border p-2 hover:bg-accent cursor-pointer">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium">
              {student.name.split(" ").map(n => n[0]).join("")}
            </span>
          )}
        </div>
        <span className="font-medium">{student.name}</span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold">{student.name}</h4>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
            <Badge variant={getStatusVariant(student.status)}>
              {student.status}
            </Badge>
          </div>
          
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student ID</span>
              <span className="font-medium">{student.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Program</span>
              <span className="font-medium">{student.program}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year</span>
              <span className="font-medium">{student.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GPA</span>
              <span className="font-medium">{student.gpa.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}