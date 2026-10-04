"use client";
import React from "react";

export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        if (props.onChange) props.onChange(e);
        e.target.form?.requestSubmit();
      }}
    />
  );
}
