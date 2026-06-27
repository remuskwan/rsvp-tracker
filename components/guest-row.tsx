"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface GuestRowProps {
  index: number;
  isFirst: boolean;
  onRemove?: () => void;
  name: string;
  attending: boolean;
  dietary: string;
  onChange: (field: "name" | "attending" | "dietary", value: string | boolean) => void;
}

export function GuestRow({
  index,
  isFirst,
  onRemove,
  name,
  attending,
  dietary,
  onChange,
}: GuestRowProps) {
  return (
    <div className="border border-warm-200 rounded-lg p-4 space-y-3 bg-muted">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-warm-700">
          {isFirst ? "You" : `Guest ${index + 1}`}
        </h4>
        {!isFirst && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`guest-name-${index}`} className="text-xs">
            {isFirst ? "Your Name *" : "Full Name *"}
          </Label>
          <Input
            id={`guest-name-${index}`}
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder={isFirst ? "Your full name" : "Guest's full name"}
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Attending?</Label>
          <div className="flex gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`guest-attending-${index}`}
                checked={attending === true}
                onChange={() => onChange("attending", true)}
                className="accent-primary"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`guest-attending-${index}`}
                checked={attending === false}
                onChange={() => onChange("attending", false)}
                className="accent-primary"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>
      </div>

      {attending && (
        <div className="space-y-1">
          <Label htmlFor={`guest-dietary-${index}`} className="text-xs">
            Dietary Restrictions
          </Label>
          <Input
            id={`guest-dietary-${index}`}
            value={dietary}
            onChange={(e) => onChange("dietary", e.target.value)}
            placeholder="e.g. vegetarian, nut allergy, halal — leave blank if none"
          />
        </div>
      )}
    </div>
  );
}
