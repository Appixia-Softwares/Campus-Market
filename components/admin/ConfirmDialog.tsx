import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmText = "Confirm", cancelText = "Cancel" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="mb-4 text-muted-foreground">{description}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelText}</Button>
          <Button variant="destructive" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 