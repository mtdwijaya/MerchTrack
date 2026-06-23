"use client";

interface Props {
  open: boolean;

  title: string;

  message: string;

  onConfirm: () => void;

  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        bg-black/40
        flex
        items-center
        justify-center
        z-50
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          p-6
          w-100
        "
      >
        <h3 className="font-semibold text-lg">
          {title}
        </h3>

        <p className="mt-3 text-gray-500">
          {message}
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="
              px-4
              py-2
              border
              rounded-lg
            "
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            className="
              px-4
              py-2
              bg-red-600
              text-white
              rounded-lg
            "
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}