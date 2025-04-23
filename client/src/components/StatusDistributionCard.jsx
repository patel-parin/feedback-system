export default function StatusDistributionCard({ data }) {
  // Make sure data exists and has the expected structure
  if (!data || !data.statusDistribution) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
        <div className="text-neutral-dark">No data available</div>
      </div>
    );
  }

  const { new: newCount = 0, inProgress = 0, resolved = 0 } = data.statusDistribution;
  const total = newCount + inProgress + resolved;

  // Calculate percentages
  const newPercentage = total > 0 ? (newCount / total) * 100 : 0;
  const inProgressPercentage = total > 0 ? (inProgress / total) * 100 : 0;
  const resolvedPercentage = total > 0 ? (resolved / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>New</span>
            <span className="text-neutral-dark">
              {newCount} ({newPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-neutral-light rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${newPercentage}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>In Progress</span>
            <span className="text-neutral-dark">
              {inProgress} ({inProgressPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-neutral-light rounded-full h-2">
            <div 
              className="bg-warning h-2 rounded-full" 
              style={{ width: `${inProgressPercentage}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Resolved</span>
            <span className="text-neutral-dark">
              {resolved} ({resolvedPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-neutral-light rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full" 
              style={{ width: `${resolvedPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
