"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-secondary/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "center" | "right" | "bottom";
  }
>(({ className, children, side = "center", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 border border-border bg-card shadow-elevated transition ease-in-out duration-200",
        side === "center" &&
          "left-[50%] top-[50%] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl p-6",
        side === "right" &&
          "inset-y-0 right-0 h-[100dvh] w-full max-w-lg border-l p-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:rounded-l-2xl",
        side === "bottom" &&
          "inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-2xl p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom md:hidden",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-xl bg-muted p-2 text-foreground transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring">
        <X className="h-5 w-5" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
};
