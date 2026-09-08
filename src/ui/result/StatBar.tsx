interface StatBarProps {
  label: string;
  value: number;
}

export function StatBar({ label, value }: StatBarProps) {
  return (
    <div className="ff-stat-row">
      <div className="ff-stat-label">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="ff-stat-track">
        <div className="ff-stat-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
