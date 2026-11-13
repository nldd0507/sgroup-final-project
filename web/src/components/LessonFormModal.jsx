import { api } from "../api/client.js";
import { useAsync } from "../lib/useAsync.js";
import Modal, { ModalActions } from "./Modal.jsx";
import { Field, FormError, useForm } from "./form.jsx";
import { ErrorState, Spinner } from "./ui.jsx";
import { useToast } from "./Toast.jsx";

// Mentor tạo bài học (lessonId trống) hoặc sửa (tải nội dung đầy đủ trước khi hiện form)
export default function LessonFormModal({ open, lessonId, classId, nextOrder = 1, onClose, onSaved }) {
  const { data, error, loading } = useAsync(
    () => (open && lessonId ? api.get(`/lessons/${lessonId}`) : Promise.resolve(null)),
    [open, lessonId]
  );
  if (!open) return null;
  if (lessonId && (loading || error || !data)) {
    return (
      <Modal open title="Sửa bài học" onClose={onClose}>
        {error ? <ErrorState error={error} /> : <div className="full-loader"><Spinner size={24} /></div>}
      </Modal>
    );
  }
  return (
    <LessonForm key={lessonId ?? "new"} lesson={data} classId={classId} nextOrder={nextOrder} onClose={onClose} onSaved={onSaved} />
  );
}

function LessonForm({ lesson, classId, nextOrder, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !lesson;
  const form = useForm({
    title: lesson?.title ?? "",
    order: String(lesson?.order ?? nextOrder),
    content: lesson?.content ?? "",
  });
  const { values: v, set, errors, formError, busy } = form;

  const validate = (val) => ({
    title: !val.title.trim() ? "Nhập tiêu đề bài học." : val.title.trim().length > 200 ? "Tiêu đề tối đa 200 ký tự." : null,
    order: !/^\d+$/.test(val.order) || Number(val.order) < 1 ? "Thứ tự là số nguyên từ 1 trở lên." : null,
  });

  const save = () =>
    form.submit(validate, async (val) => {
      const body = { title: val.title.trim(), order: Number(val.order), content: val.content };
      const saved = isNew
        ? await api.post(`/classes/${classId}/lessons`, body)
        : await api.patch(`/lessons/${lesson.id}`, body);
      toast.success(isNew ? "Đã thêm bài học, học viên trong lớp thấy ngay." : "Đã lưu bài học.");
      onSaved(saved);
    });

  return (
    <Modal
      open
      title={isNew ? "Thêm bài học" : "Sửa bài học"}
      description={isNew ? "Học viên đọc nội dung và đánh dấu đã học để tính tiến độ." : undefined}
      onClose={onClose}
      busy={busy}
      width={640}
      onSubmit={save}
      footer={<ModalActions onCancel={onClose} busy={busy} submitLabel={isNew ? "Thêm bài học" : "Lưu"} />}
    >
      <div className="field-row" style={{ gridTemplateColumns: "minmax(0,1fr) 120px" }}>
        <Field id="l-title" label="Tiêu đề" value={v.title} onChange={set("title")} error={errors.title} placeholder="Middleware trong Express" />
        <Field id="l-order" label="Thứ tự" type="number" min={1} inputMode="numeric" value={v.order} onChange={set("order")} error={errors.order} />
      </div>
      <Field
        id="l-content"
        as="textarea"
        label="Nội dung"
        value={v.content}
        onChange={set("content")}
        rows={10}
        placeholder="Mục tiêu, lý thuyết, ví dụ, link tài liệu…"
        hint="Xuống dòng được giữ nguyên khi hiển thị."
      />
      <FormError message={formError} />
    </Modal>
  );
}
