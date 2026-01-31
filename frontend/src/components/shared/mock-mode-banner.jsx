"use client";

import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlaskConical } from "lucide-react";

export function MockModeBanner() {
  const { mockMode, user, toggleMockMode, setMockRole } = useAuth();
  // When mock mode is off, show a slim bar so user can turn it back on
  if (!mockMode) {
    return (
      <div className="bg-slate-700 text-slate-200 py-1.5 px-4 text-sm flex items-center justify-between gap-4 flex-wrap">
        <span className="text-slate-400 text-xs">Mock mode is off (using live API)</span>
        <div className="flex items-center gap-2">
          <Label htmlFor="mock-toggle-off" className="text-slate-400 text-xs cursor-pointer">
            Turn mock mode back on
          </Label>
          <Switch id="mock-toggle-off" checked={false} onCheckedChange={toggleMockMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 text-slate-100 py-1.5 px-4 text-sm flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-amber-600/80 text-white border-0">
          <FlaskConical className="h-3 w-3 mr-1" />
          Mock Mode
        </Badge>
        <span>
          Role: <strong>{user?.role || "—"}</strong>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-slate-200 hover:text-white">
              Switch role
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setMockRole("nurse")}>Nurse</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMockRole("patient")}>Patient</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMockRole("specialist")}>Specialist</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="mock-toggle" className="text-slate-300 text-xs">
          Mock mode
        </Label>
        <Switch id="mock-toggle" checked={mockMode} onCheckedChange={toggleMockMode} />
      </div>
    </div>
  );
}
