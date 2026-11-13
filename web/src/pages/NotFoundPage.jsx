import { Link } from "react-router";
import { Compass } from "lucide-react";
import { EmptyState } from "../components/ui.jsx";

export default function NotFoundPage() {
  return (
    <section className="panel">
      <EmptyState icon={Compass} title="Không có trang này">
        Đường dẫn có thể đã sai hoặc trang chưa được làm.
      </EmptyState>
      <div className="center">
        <Link className="btn btn-primary" to="/">
          Về trang tổng quan
        </Link>
      </div>
    </section>
  );
}
