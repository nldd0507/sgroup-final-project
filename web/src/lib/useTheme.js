import { useCallback, useEffect, useState } from "react";

const KEY = "sg.theme";
const media = () => window.matchMedia?.("(prefers-color-scheme: dark)");

const currentTheme = () => {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return media()?.matches ? "dark" : "light";
};

// Mặc định theo hệ điều hành; bấm nút thì ghi nhớ lựa chọn
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    const mq = media();
    if (!mq) return;
    const onChange = () => setTheme(currentTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* không lưu được thì chỉ đổi cho lần mở này */
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
