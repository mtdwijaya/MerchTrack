import { toast } from "sonner";

export function showSuccess(message: string) {
  toast.success(message);
}

export function showError(message: string) {
  toast.error(message);
}

export function showInfo(message: string) {
  toast.info(message);
}

export function showSuccessAndGo(message: string, action: () => void) {
  toast.success(message);
  setTimeout(action, 400);
}
