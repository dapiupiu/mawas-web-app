type VisualPlaceholderProps = { label: string; className?: string };

export function VisualPlaceholder({
  label,
  className = "",
}: VisualPlaceholderProps) {
  return (
    <div
      className={`relative grid min-h-64 overflow-hidden ${className}`}
      role="img"
      aria-label={`Placeholder gambar: ${label}`}
    >
      <img src="https://lh3.googleusercontent.com/aida/AEtjO1W9T6So97c97ciq2sDDYOPWx7gFrj_ZOx1674h3divPeQKTLeK7KebeKPoMSRqK9Tr0uZZI4RcpJG0ED32U1z4wcV6GEdClMG_gXJScwEAOiRy7GLScEk7waMlpUqzccYDjnxbiAOum_g3B2nEfXTAhFWjN-Lq-zhM1FiiwwT2Qbx9cnFdOc4tN2blM6oVS6saV5I0ITOKUtkFMGBLlxqob3Lb9qZv88_PQHsuLGM2-JhQ9sw400_-elcQ=s1600" alt={label} />
    </div>
  );
}
