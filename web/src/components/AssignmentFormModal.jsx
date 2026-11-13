import { api } from "../api/client.js";
import { useAsync } from "../lib/useAsync.js";
import { isoToLocalInput, localInputToIso } from "../lib/roles.js";
import Modal, { ModalActions } from "./Modal.jsx";
import { Field, FormError, useForm } from "./form.jsx";
import { ErrorState, Spinner } from "./ui.jsx";
import { useToast } from "./Toast.jsx";

// Hạn mặc định: 7 ngày nữa, 23:59
const defaultDeadline = () => {
  const d = new Date(Date.now() + 7 * 86_400_000);
  d.setHours(23, 59, 0, 0);
  return isoToLocalInput(d.toISOString());
};

export default function AssignmentFormModal({ open, assignmentId, classId, onClose, onSaved }) {
  const { data, error, loading } = useAsync(
    () => (open && assignmentId ? api.get(`/assignments/${assignmentId}`) : Promise.resolve(null)),
    [open, assignmentId]
  );
  if (!open) return null;
  if (assignmentId && (loading || error || !data)) {
    return (
      <Modal open title="Sửa bài tập" onClose={onClose}>
        {error ? <ErrorState error={error} /> : <div className="full-loader"><Spinner size={24} /></div>}
      </Modal>
    );
  }
  return <AssignmentForm key={assignmentId ?? "new"} assignment={data} classId={classId} onClose={onClose} onSaved={onSaved} />;
}

function AssignmentForm({ assignment, classId, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !assignment;
  const form = useForm({
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    deadline: assignment ? isoToLocalInput(assignment.deadline) : defaultDeadline(),
    maximumScore: String(assignment?.maximumScore ?? 10),
  });
  const { values: v, set, errors, formError, busy } = form;
  const inPast = v.deadline && new Date(v.deadline).getTime() < Date.now();

  const validate = (val) => ({
    title: val.title.trim().length < 2 || val.title.trim().length > 200 ? "Tiêu đề dài từ 2 đến 200 ký tự." : null,
    description: val.description.length > 5000 ? "Mô tả tối đa 5000 ký tự." : null,
    deadline: !val.deadline || Number.isNaN(new Date(val.deadline).getTime()) ? "Chọn hạn nộp." : null,
    maximumScore:
      !/^\d+$/.test(val.maximumScore) || Number(val.maximumScore) < 1 ? "Thang điểm là số nguyên từ 1 trở lên." : null,
  });

  const save = () =>
    form.submit(validate, async (val) => {
      const body = {
        title: val.title.trim(),
        description: val.description.trim(),
        deadline: localInputToIso(val.deadline),
        maximumScore: Number(val.maximumScore),
      };
      const saved = isNew
        ? await api.post(`/classes/${classId}/assignments`, body)
        : await api.patch(`/assignments/${assignment.id}`, body);
      toast.success(isNew ? "Đã giao bài tập cho cả lớp." : "Đã lưu bài tập.");
      onSaved(saved);
    });

  return (
    <Modal
      open
      title={isNew ? "Giao bài tập" : "Sửa bài tập"}
      description={isNew ? "Mỗi học viên nộp một lần, trước hạn nộp." : undefined}
      onClose={onClose}
      busy={busy}
      width={600}
      onSubmit={save}
      footer={<ModalActions onCancel={onClose} busy={busy} submitLabel={isNew ? "Giao bài" : "Lưu"} />}
    >
      <Field id="a-title" label="Tiêu đề" value={v.title} onChange={set("title")} error={errors.title} placeholder="Xây dựng REST API cho Todo" />
      <Field
        id="a-desc"
        as="textarea"
        label="Đề bài"
        value={v.description}
        onChange={set("description")}
        error={errors.description}
        rows={6}
        placeholder="Yêu cầu, tiêu chí chấm, cách nộp (link repo hay nội dung)…"
      />
      <div className="field-row">
        <Field
          id="a-deadline"
          type="datetime-local"
          label="Hạn nộp"
          value={v.deadline}
          onChange={set("deadline")}
          error={errors.deadline}
          hint={inPast ? "Hạn này đã qua: học viên sẽ không nộp được." : "Theo giờ máy của bạn."}
        />
        <Field
          id="a-max"
          type="number"
          min={1}
          inputMode="numeric"
          label="Thang điểm"
          value={v.maximumScore}
          onChange={set("maximumScore")}
          error={errors.maximumScore}
          hint="Điểm tối đa khi chấm."
        />
      </div>
      <FormError message={formError} />
    </Modal>
  );
}
