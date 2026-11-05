import { ProjectFormModal } from "./ProjectFormModal";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectModalProps) {
  return (
    <ProjectFormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={() => onSuccess()}
    />
  );
}
