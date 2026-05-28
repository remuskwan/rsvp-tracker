"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAdmin, removeAdmin } from "@/app/actions/admin";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

export interface Admin {
  email: string;
  created_at: string;
}

interface AdminsClientProps {
  admins: Admin[];
  currentUserEmail: string;
}

export function AdminsClient({ admins: initial, currentUserEmail }: AdminsClientProps) {
  const [admins, setAdmins] = useState(initial);
  const [newEmail, setNewEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addAdmin(newEmail);
      if (result.success) {
        setAdmins((prev) => [
          ...prev,
          { email: newEmail.trim().toLowerCase(), created_at: new Date().toISOString() },
        ]);
        setNewEmail("");
        toast.success("Admin added.");
      } else {
        toast.error(result.error ?? "Failed to add admin.");
      }
    });
  };

  const handleRemove = (email: string) => {
    startTransition(async () => {
      const result = await removeAdmin(email);
      if (result.success) {
        setAdmins((prev) => prev.filter((a) => a.email !== email));
        toast.success("Admin removed.");
      } else {
        toast.error(result.error ?? "Failed to remove admin.");
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">Admins</h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage who has access to the admin panel.
        </p>
      </div>

      {/* Current admins list */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden mb-8">
        {admins.length === 0 ? (
          <p className="p-6 text-sm text-stone-400 text-center">No admins found.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {admins.map((admin) => (
              <li key={admin.email} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-stone-800">{admin.email}</p>
                  <p className="text-xs text-stone-400">
                    Added {new Date(admin.created_at).toLocaleDateString()}
                    {admin.email === currentUserEmail && (
                      <span className="ml-2 text-stone-500 font-medium">(you)</span>
                    )}
                  </p>
                </div>
                {admin.email !== currentUserEmail && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleRemove(admin.email)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add admin form */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">Add admin</h2>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="new-email" className="sr-only">Email address</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={isPending || !newEmail.trim()}
            className="rounded-full gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
