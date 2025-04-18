"use client";

import { Dialog } from "@headlessui/react";
import Chat from "@/components/Chat";
import type { ChatDialogProps } from "@/types/trade";
import { useEffect, useRef } from "react";

export default function ChatDialog({
  isOpen,
  onClose,
  selectedOrder,
  paymentStatus,
  onPaymentConfirmation,
  polling,
  currentUserAddress,
  isPlaySound,
}: ChatDialogProps) {
  const soundUrl = process.env.NEXT_PUBLIC_SOUND_NOTIFICATION;
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!soundUrl) return;

    if (!soundRef.current) {
      soundRef.current = new Audio(soundUrl);
    }

    if (isPlaySound) {
      soundRef.current.currentTime = 0;
      soundRef.current
        .play()
        .catch((err) => console.error("Error playing sound:", err));
    } else {
      soundRef.current.pause();
    }
  }, [isPlaySound, soundUrl]);

  if (!selectedOrder) return null;

  const isSeller = selectedOrder.type !== "buy";

  return (
    <Dialog open={isSeller || isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white shadow-2xl">
          <Chat
            orderId={selectedOrder.transaction_id}
            currentUser={currentUserAddress}
            otherUser={selectedOrder.counterparty_id}
            transactionId={selectedOrder.transaction_id}
            role={selectedOrder.type === "buy" ? "buyer" : "seller"}
            buyer_payment_confirmed={
              paymentStatus[selectedOrder.transaction_id]?.buyer || false
            }
            seller_payment_confirmed={
              paymentStatus[selectedOrder.transaction_id]?.seller || false
            }
            onPaymentConfirm={() => onPaymentConfirmation(selectedOrder)}
            polling={polling}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
