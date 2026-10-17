export default function SkeletonCard() {
  return (
    <li className="card card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--img" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line skeleton--short" />
    </li>
  );
}
