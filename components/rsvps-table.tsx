"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateRsvpStatus } from "@/app/actions/admin";
import {
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
} from "lucide-react";

interface GuestEntry {
  name: string;
  attending: boolean;
  dietary?: string;
}

interface Rsvp {
  id: string;
  created_at: string;
  submitter_name: string;
  email: string;
  phone?: string | null;
  attending: boolean;
  party_size: number;
  guests: GuestEntry[];
  side?: string | null;
  message?: string | null;
  followup_status: string;
  admin_notes?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  no_response: "No Response",
};

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "default",
  contacted: "secondary",
  confirmed: "outline",
  no_response: "destructive",
};

function RsvpRow({ rsvp }: { rsvp: Rsvp }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(rsvp.followup_status);
  const [notes, setNotes] = useState(rsvp.admin_notes ?? "");
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateRsvpStatus(rsvp.id, status, notes);
      if (result.success) {
        toast.success("Updated");
        setEditing(false);
      } else {
        toast.error(result.error ?? "Update failed");
      }
    });
  };

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-stone-50">
        <TableCell>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-left"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-stone-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-400" />
            )}
            <span className="font-medium">{rsvp.submitter_name}</span>
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <a
              href={`mailto:${rsvp.email}`}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3" />
              {rsvp.email}
            </a>
          </div>
          {rsvp.phone && (
            <a
              href={`tel:${rsvp.phone}`}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {rsvp.phone}
            </a>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={rsvp.attending ? "outline" : "destructive"}>
            {rsvp.attending ? `Yes (${rsvp.party_size})` : "No"}
          </Badge>
        </TableCell>
        <TableCell>
          {rsvp.side ? (
            <span className="text-sm capitalize">{rsvp.side}&apos;s side</span>
          ) : (
            <span className="text-stone-300 text-sm">—</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={STATUS_COLORS[status] ?? "default"}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-stone-400">
          {new Date(rsvp.created_at).toLocaleDateString("en-SG", {
            day: "numeric",
            month: "short",
          })}
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-stone-50">
          <TableCell colSpan={6} className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
              {/* Guests */}
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                  Guests
                </p>
                <div className="space-y-1">
                  {rsvp.guests.map((g: GuestEntry, i: number) => (
                    <div key={i} className="text-sm">
                      <span className={g.attending ? "" : "line-through text-stone-400"}>
                        {g.name}
                      </span>
                      {g.dietary && (
                        <span className="ml-2 text-xs text-amber-600">
                          🍽 {g.dietary}
                        </span>
                      )}
                      {!g.attending && (
                        <span className="ml-2 text-xs text-stone-400">(not attending)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              {rsvp.message && (
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                    Message
                  </p>
                  <p className="text-sm text-stone-700 italic">&ldquo;{rsvp.message}&rdquo;</p>
                </div>
              )}

              {/* Admin panel */}
              <div className="md:col-span-2 border-t border-stone-200 pt-4">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                  Follow-up
                </p>
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-center">
                      <label className="text-sm text-stone-600 w-16">Status</label>
                      <Select value={status} onValueChange={(v) => setStatus(v ?? status)}>
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3 items-start">
                      <label className="text-sm text-stone-600 w-16 pt-2">Notes</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Internal notes…"
                        rows={2}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={save} disabled={isPending}>
                        {isPending ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Badge variant={STATUS_COLORS[status] ?? "default"}>
                      {STATUS_LABELS[status] ?? status}
                    </Badge>
                    {notes && (
                      <span className="text-sm text-stone-500">{notes}</span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function RsvpsTable({ rsvps }: { rsvps: Rsvp[] }) {
  const [search, setSearch] = useState("");
  const [filterAttending, setFilterAttending] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = rsvps.filter((r) => {
    const matchesSearch =
      !search ||
      r.submitter_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());

    const matchesAttending =
      filterAttending === "all" ||
      (filterAttending === "yes" && r.attending) ||
      (filterAttending === "no" && !r.attending);

    const matchesStatus =
      filterStatus === "all" || r.followup_status === filterStatus;

    return matchesSearch && matchesAttending && matchesStatus;
  });

  const totalAttending = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + r.party_size, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-6 text-sm text-stone-600">
        <span>
          <strong className="text-stone-900">{rsvps.length}</strong> submissions
        </span>
        <span>
          <strong className="text-stone-900">{totalAttending}</strong> attending
        </span>
        <span>
          <strong className="text-stone-900">
            {rsvps.filter((r) => !r.attending).length}
          </strong>{" "}
          not attending
        </span>
        <span>
          <strong className="text-stone-900">
            {rsvps.filter((r) => r.followup_status === "new").length}
          </strong>{" "}
          new / uncontacted
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
        <Select value={filterAttending} onValueChange={(v) => setFilterAttending(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Attending" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All responses</SelectItem>
            <SelectItem value="yes">Attending</SelectItem>
            <SelectItem value="no">Not attending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <a href="/api/rsvps/export">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </a>
      </div>

      {/* Table */}
      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Attending</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-stone-400 py-8"
                >
                  No RSVPs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rsvp) => <RsvpRow key={rsvp.id} rsvp={rsvp} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
