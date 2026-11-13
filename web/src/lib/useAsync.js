import { useCallback, useEffect, useRef, useState } from "react";

// Chạy một hàm async khi component mở (và khi deps đổi), trả về { data, error, loading, reload }.
// Bỏ qua kết quả của lần gọi cũ nếu đã có lần gọi mới hơn.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const callId = useRef(0);

  const run = useCallback(() => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => id === callId.current && setState({ data, error: null, loading: false }),
      (error) => id === callId.current && setState({ data: null, error, loading: false })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}
