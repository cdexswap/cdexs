'use client';

import { Dialog } from '@headlessui/react';
import { CancelConfirmDialogProps } from '@/types/trade';

export default function CancelConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isCancelling
}: CancelConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-sm rounded-xl bg-white shadow-2xl p-6">
          <Dialog.Title className="text-lg font-bold text-gray-900 mb-4">
            Cancel Order
          </Dialog.Title>
          <p className="text-gray-600 mb-6">
            Are you sure you want to cancel this order? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              No, keep it
            </button>
            <button
              onClick={onConfirm}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, cancel order'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
