"use client";

import { useEffect, useRef } from "react";

// After a failed submit, move focus to the first field with an error, or to the form-level
// message, so keyboard and screen reader users land on what needs fixing (WCAG 3.3.1).
export function useFormFocus(errors: Record<string, string> | undefined, hasFormError: boolean) {
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstField = Object.keys(errors ?? {})[0];
    if (firstField) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus();
    } else if (hasFormError) {
      messageRef.current?.focus();
    }
  }, [errors, hasFormError]);

  return { formRef, messageRef };
}
