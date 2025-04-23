export default function StatCard({ title, value, icon, color }) {
  // Define background colors for different icon types
  const bgColors = {
    forum: "bg-blue-100",
    pending: "bg-orange-100",
    check_circle: "bg-green-100",
    priority_high: "bg-red-100"
  };

  // Define text colors for different icon types
  const textColors = {
    forum: "text-primary",
    pending: "text-warning",
    check_circle: "text-success",
    priority_high: "text-error"
  };

  const bgColor = bgColors[icon] || "bg-blue-100";
  const textColor = textColors[icon] || "text-primary";

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`rounded-full ${bgColor} p-3 mr-4`}>
        <span className={`material-icons ${textColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-neutral-dark">{title}</p>
        <p className="text-2xl font-medium">{value}</p>
      </div>
    </div>
  );
}
