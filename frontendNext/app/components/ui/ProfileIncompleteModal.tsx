"use client";

import React from "react";
import Modal from "@/app/components/ui/Modal";
import Button from "@/app/components/ui/Button";
import { useRouter } from "next/navigation";

interface ProfileIncompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileIncompleteModal({
  isOpen,
  onClose,
}: ProfileIncompleteModalProps) {
  const router = useRouter();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Your Profile">
      <div className="space-y-4">
        <p className="text-gray-700">
          To borrow or lend books, please complete your profile first.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onClose();
              router.push("/profile/edit");
            }}
          >
            Go to Profile
          </Button>
        </div>
      </div>
    </Modal>
  );
}
