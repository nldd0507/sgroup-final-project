import { api } from "../api/client.js";
import { useAsync } from "../lib/useAsync.js";
import Modal, { ModalActions } from "./Modal.jsx";
import { Field, FormError, useForm } from "./form.jsx";
import { useToast } from "./Toast.jsx";

// Admin tạo hoặc sửa lớp. Mentor chọn trong số user role MEMBER (mentor không phải role riêng).
export default function ClassFormModal({ open, cls, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !cls;
  const { data: users } = useAsync(() => (open ? api.get("/users") : Promise.resolve(null)), [open]);
  const form = useForm({
    name: cls?.name ?? "",
    description: cls?.description ?? "",
    startDate: cls?.startDate ?? "",
    endDate: cls?.endDate ?? "",
    mentorId: cls?.mentorId ?? cls?.mentor?.id ?? "",
  });
  const { values: v, set, errors, formError, busy } = form;
  const mentors = (users ?? []).filter((u) => u.role === "MEMBER");

  const validate = (val) => ({
    name: val.name.trim().length < 2 || val.name.trim().length > 150 ? "Tên lớp dài từ 2 đến 150 ký tự." : null,
    description: val.description.length > 2000 ? "Mô tả tối đa 2000 ký tự." : null,
    startDate: !val.startDate ? "Chọn ngày bắt đầu." : null,
    endDate: !val.endDate
      ? "Chọn ngày kết thúc."
      : val.startDate && val.endDate <= val.startDate
        ? "Ngày kết thúc phải sau ngày bắt đầu."
        : null,
    mentorId: !val.mentorId ? "Chọn mentor phụ trách lớp." : null,
  });

  const save = () =>
    form.submit(validate, async (val) => {
      const body = {
        name: val.name.trim(),
        description: val.description.trim(),
        startDate: val.startDate,
        endDate: val.endDate,
        mentorId: Number(val.mentorId),
      };
      const saved = isNew ? await api.post("/classes", body) : await api.patch(`/classes/${cls.id}`, body);
      toast.success(isNew ? `Đã tạo lớp ${body.name}.` : "Đã lưu thông tin lớp.");
      onSaved(saved);
    });

  return (
    <Modal
      open={open}
      title={isNew ? "Tạo lớp học" : "Sửa thông tin lớp"}
      description={isNew ? "Sau khi tạo, vào lớp để thêm học viên." : cls.name}
      onClose={onClose}
      busy={busy}
      width={560}
      onSubmit={save}
      footer={<ModalActions onCancel={onClose} busy={busy} submitLabel={isNew ? "Tạo lớp" : "Lưu"} />}
    >
      <Field id="c-name" label="Tên lớp" value={v.name} onChange={set("name")} error={errors.name} placeholder="BE Basic - Batch 02" />
      <Field
        id="c-desc"
        as="textarea"
        label="Mô tả"
        value={v.description}
        onChange={set("description")}
        error={errors.description}
        placeholder="Nội dung chính, đối tượng học viên…"
        rows={3}
      />
      <div className="field-row">
        <Field id="c-start" type="date" label="Ngày bắt đầu" value={v.startDate} onChange={set("startDate")} error={errors.startDate} />
        <Field id="c-end" type="date" label="Ngày kết thúc" value={v.endDate} onChange={set("endDate")} error={errors.endDate} />
      </div>
      <Field
        id="c-mentor"
        as="select"
        label="Mentor"
        value={v.mentorId}
        onChange={set("mentorId")}
        error={errors.mentorId}
        hint="Mentor tạo bài học, giao bài tập và chấm bài cho lớp này."
      >
        <option value="">{users ? "Chọn mentor" : "Đang tải danh sách…"}</option>
        {mentors.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {u.email}
          </option>
        ))}
      </Field>
      <FormError message={formError} />
    </Modal>
  );
}
