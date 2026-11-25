"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";

type ConfirmDialogBodyProps = {
  description: string;
  confirmLabel: string;
  confirmVariant?: "gold" | "orchard" | "danger";
  noteLabel?: string;
  notePlaceholder?: string;
  requireNote?: boolean;
  quickReasons?: readonly string[];
  pending?: boolean;
  onConfirm: (note: string) => void;
};

function ConfirmDialogBody({
  description,
  confirmLabel,
  confirmVariant = "gold",
  noteLabel,
  notePlaceholder,
  requireNote = false,
  quickReasons,
  pending = false,
  onConfirm,
}: ConfirmDialogBodyProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = note.trim();
    if (requireNote && trimmed.length < 3) {
      setError("Mohon isi alasan/catatan minimal 3 karakter.");
      return;
    }
    setError(null);
    onConfirm(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4">
      <DialogDescription className="text-sm leading-relaxed text-moss">{description}</DialogDescription>

      {quickReasons && quickReasons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {quickReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => {
                setNote(reason);
                setError(null);
              }}
              className="rounded-full border border-orchard/15 bg-cream-2 px-3 py-1 text-[11px] font-medium text-orchard transition hover:border-gold hover:bg-custard"
            >
              {reason}
            </button>
          ))}
        </div>
      ) : null}

      {noteLabel ? (
        <Field label={noteLabel} htmlFor="confirm-note" error={error ? [error] : undefined}>
          <Textarea
            id="confirm-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error) setError(null);
            }}
            placeholder={notePlaceholder}
            className="min-h-20"
          />
        </Field>
      ) : null}

      <div className="flex justify-end gap-2.5 pt-2">
        <DialogClose className="inline-flex h-10 items-center rounded-full border border-orchard/15 px-4 text-xs font-semibold text-bark hover:bg-cream-2">
          Batal
        </DialogClose>
        <Button type="submit" variant={confirmVariant} disabled={pending}>
          {pending ? "Memproses…" : confirmLabel}
        </Button>
      </div>
    </form>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  ...bodyProps
}: ConfirmDialogBodyProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle className="font-display text-xl font-bold text-orchard">{title}</DialogTitle>
        {open ? <ConfirmDialogBody key={title} {...bodyProps} /> : null}
      </DialogContent>
    </Dialog>
  );
}
