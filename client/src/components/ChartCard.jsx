export default function ChartCard({ title, data }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 col-span-2">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="h-64 flex items-end justify-around">
        {data && Object.entries(data).map(([category, count], index) => {
          // Calculate the percentage height (max 90%)
          const maxValue = Math.max(...Object.values(data));
          const percentage = maxValue > 0 ? (count / maxValue) * 90 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center w-1/5">
              <div 
                className="chart-bar bg-primary w-full rounded-t" 
                style={{ height: `${percentage}%` }}
              ></div>
              <p className="text-xs mt-2 text-neutral-dark">{category}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
