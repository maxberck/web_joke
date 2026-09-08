interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div>
      <div className="ff-eyebrow" style={{ marginBottom: 8 }}>
        Q{String(current + 1).padStart(2, "0")} / {total}
      </div>
      <div className="ff-progress">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`ff-progress-dot${
              i < current ? " ff-progress-dot--done" : i === current ? " ff-progress-dot--current" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}
