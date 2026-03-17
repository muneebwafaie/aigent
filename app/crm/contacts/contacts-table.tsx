"use client";

import * as React from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AddContactRow } from "./add-contact-row";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";

// ─── Column definitions (static) ─────────────────────────────────────────────
const COLUMNS = [
  { key: "firstName" as const, header: "First Name", placeholder: "First name" },
  { key: "lastName" as const, header: "Last Name", placeholder: "Last name" },
  { key: "email" as const, header: "Email", placeholder: "Email" },
  { key: "jobTitle" as const, header: "Job Title", placeholder: "Job title" },
] as const;

type EditableField = (typeof COLUMNS)[number]["key"];

// ─── Props ───────────────────────────────────────────────────────────────────
interface ContactsTableProps {
  contacts: (Doc<"contacts"> & { isOptimistic?: boolean })[] | undefined;
  onRowClick: (id: Id<"contacts">) => void;
}


// ─── Main component ──────────────────────────────────────────────────────────
export function ContactsTable({ contacts, onRowClick }: ContactsTableProps) {
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = React.useState({ row: 0, col: 0 });
  const [deleteId, setDeleteId] = React.useState<Id<"contacts"> | null>(null);

  const updateContact = useMutation(api.contacts.update).withOptimisticUpdate(
    (localStore, { id, ...updates }) => {
      const existing = localStore.getQuery(api.contacts.get, { id });
      if (existing) {
        localStore.setQuery(api.contacts.get, { id }, { ...existing, ...updates, isOptimistic: true } as any);
      }
      const list = localStore.getQuery(api.contacts.list);
      if (list) {
        localStore.setQuery(
          api.contacts.list,
          {},
          list.map((c) => (c._id === id ? ({ ...c, ...updates, isOptimistic: true } as any) : c))
        );
      }
    }
  );

  const removeContact = useMutation(api.contacts.remove).withOptimisticUpdate(
    (localStore, { id }) => {
      const list = localStore.getQuery(api.contacts.list);
      if (list) {
        localStore.setQuery(
          api.contacts.list,
          {},
          list.map((c) => (c._id === id ? ({ ...c, isOptimistic: true } as any) : c))
        );
      }
    }
  );

  // ── Cell value save — fire-and-forget, silent for non-critical ───────────
  const saveField = React.useCallback(
    (contactId: Id<"contacts">, field: EditableField, value: string, original: string) => {
      if (value === original) return;
      // Fire-and-forget: optimistic update handles the UI instantly.
      // Only show a toast on error (Convex rolls back optimistic on failure).
      updateContact({ id: contactId, [field]: value }).catch(() => {
        toast.error(`Failed to update ${field}`);
      });
    },
    [updateContact]
  );

  const handleDelete = React.useCallback(
    (id: Id<"contacts">) => {
      setDeleteId(id);
    },
    []
  );

  const confirmDelete = React.useCallback(() => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    removeContact({ id }).catch(() => {
      toast.error("Failed to delete contact");
    });
    toast.success("Contact deleted");
  }, [deleteId, removeContact]);

  // ── Focus management ────────────────────────────────────────────────────
  const moveFocus = React.useCallback(
    (row: number, col: number) => {
      if (!contacts) return;
      const totalRows = contacts.length + 1; // +1 for the "Add Contact" row
      const totalCols = COLUMNS.length;
      if (row < 0 || row >= totalRows || col < 0 || col >= totalCols) return;

      setFocusedCell({ row, col });
      requestAnimationFrame(() => {
        const input = tableRef.current?.querySelector(
          `input[data-row="${row}"][data-col="${col}"]`
        ) as HTMLInputElement | null;
        input?.focus();
      });
    },
    [contacts]
  );

  // ── Table-level keyboard handler ────────────────────────────────────────
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!contacts || contacts.length === 0) return;
      const { row, col } = focusedCell;
      const target = e.target as HTMLInputElement;
      const isInput = target.tagName === "INPUT";

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveFocus(row - 1, col);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveFocus(row + 1, col);
          break;
        case "ArrowLeft":
          if (!isInput || target.selectionStart === 0) {
            e.preventDefault();
            moveFocus(row, col - 1);
          }
          break;
        case "ArrowRight":
          if (!isInput || target.selectionStart === target.value.length) {
            e.preventDefault();
            moveFocus(row, col + 1);
          }
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            if (col > 0) moveFocus(row, col - 1);
            else if (row > 0) moveFocus(row - 1, COLUMNS.length - 1);
          } else {
            if (col < COLUMNS.length - 1) moveFocus(row, col + 1);
            else if (row < contacts.length) moveFocus(row + 1, 0); // Allow moving to "Add" row
          }
          break;
        case "Delete":
        case "Backspace":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleDelete(contacts[row]._id);
          }
          break;
      }
    },
    [contacts, focusedCell, moveFocus, handleDelete]
  );

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (contacts === undefined) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <Table ref={tableRef} onKeyDown={handleKeyDown} className="outline-none">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-muted/30">
            {COLUMNS.map((col) => (
              <TableHead key={col.key} className="h-11 font-semibold text-muted-foreground px-4">
                {col.header}
              </TableHead>
            ))}
            <TableHead className="h-11 w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length + 1}
                className="h-32 text-center text-muted-foreground animate-in fade-in duration-500"
              >
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-medium">No contacts yet</p>
                  <p className="text-xs text-muted-foreground">Add your first one using the row below</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {contacts.map((contact, rowIndex) => (
            <ContactRow
              key={contact._id}
              contact={contact}
              rowIndex={rowIndex}
              focusedCol={focusedCell.row === rowIndex ? focusedCell.col : -1}
              onFocusCell={(col) => setFocusedCell({ row: rowIndex, col })}
              onSaveField={saveField}
              onDelete={handleDelete}
              onView={onRowClick}
            />
          ))}
          <AddContactRow rowIndex={contacts.length} />
        </TableBody>
      </Table>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Individual row (memoized to avoid re-renders on other rows) ─────────────
interface ContactRowProps {
  contact: Doc<"contacts"> & { isOptimistic?: boolean };
  rowIndex: number;

  focusedCol: number;
  onFocusCell: (col: number) => void;
  onSaveField: (id: Id<"contacts">, field: EditableField, value: string, original: string) => void;
  onDelete: (id: Id<"contacts">) => void;
  onView: (id: Id<"contacts">) => void;
}

const ContactRow = React.memo(function ContactRow({
  contact,
  rowIndex,
  focusedCol,
  onFocusCell,
  onSaveField,
  onDelete,
  onView,
}: ContactRowProps) {
  return (
    <TableRow
      className={cn(
        "group border-b last:border-0 transition-colors hover:bg-muted/40 cursor-default",
        contact.isOptimistic && "opacity-50 grayscale-50 pointer-events-none"
      )}
    >
      {COLUMNS.map((col, colIndex) => (

        <TableCell
          key={col.key}
          className={cn(
            "p-0 transition-all relative",
            "focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-inset focus-within:bg-primary/5 focus-within:z-10"
          )}
        >
          <SpreadsheetInput
            value={contact[col.key] || ""}
            placeholder={col.placeholder}
            dataRow={rowIndex}
            dataCol={colIndex}
            onFocus={() => onFocusCell(colIndex)}
            onSave={(val) => onSaveField(contact._id, col.key, val, contact[col.key] || "")}
          />
        </TableCell>
      ))}
      <TableCell className="p-0 pr-2">
        <div className="flex items-center justify-end gap-1 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => onView(contact._id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(contact._id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

// ─── Spreadsheet input (always-editable, no loading states) ──────────────────
interface SpreadsheetInputProps {
  value: string;
  placeholder: string;
  dataRow: number;
  dataCol: number;
  onFocus: () => void;
  onSave: (value: string) => void;
}

function SpreadsheetInput({ value, placeholder, dataRow, dataCol, onFocus, onSave }: SpreadsheetInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync from server when value changes (e.g. after optimistic rollback)
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    onSave(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Save and let the table-level handler deal with navigation
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setLocalValue(value);
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      data-row={dataRow}
      data-col={dataCol}
      type="text"
      value={localValue}
      placeholder={placeholder}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onFocus={onFocus}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full h-10 px-4 bg-transparent border-0 outline-none text-sm",
        "placeholder:text-muted-foreground/50 placeholder:italic",
        "hover:bg-muted/20 focus:bg-background",
        "transition-colors duration-150"
      )}
    />
  );
}
