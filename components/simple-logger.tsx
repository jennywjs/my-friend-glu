"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface SimpleLoggerProps {
  onCancel: () => void
}

export default function SimpleLogger({ onCancel }: SimpleLoggerProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Simple Logger Test</h1>
        </div>
        <p>If you can see this, the basic component works!</p>
      </div>
    </div>
  )
}
