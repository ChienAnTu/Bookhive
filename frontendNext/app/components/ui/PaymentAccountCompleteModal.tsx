// components/ui/PaymentAccountCompleteModal.tsx
"use client";
import React from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";

export interface PaymentAccountPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string | null | undefined;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export default function PaymentAccountPromptModal({
  isOpen,
  onClose,
  email,
  onConfirm,
  loading,
}: PaymentAccountPromptModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="You’re almost there">
      <div className="space-y-4">
        <p className="text-gray-700">
          You almost here — please open your payment account to continue.
        </p>
        {!email && (
          <p className="text-sm text-red-600">Please login to continue.</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={!!loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!email || !!loading}>
            {loading ? "Redirecting..." : "Open payment account"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
