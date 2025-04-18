import { Dialog } from '@headlessui/react';

interface NotificationVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoEnded: () => void;
}

export default function NotificationVideoDialog({
  isOpen,
  onClose,
  onVideoEnded,
}: NotificationVideoDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-4xl rounded-xl bg-black shadow-2xl overflow-hidden">
          <video 
            src="/allow-notification.mov" 
            autoPlay 
            controls={false}
            className="w-full"
            onEnded={onVideoEnded}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
