import React, { useState } from 'react';

// BAR CHART
interface BarChartProps {
  data: { name: string; tickets: number }[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const maxVal = Math.max(...data.map(d => d.tickets), 10);
  const chartHeight = 200;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-end h-[220px] pb-2 border-b border-gray-100 px-2" id="bar-chart-container">
        {data.map((item, idx) => {
          const barHeight = (item.tickets / maxVal) * chartHeight;
          const pct = (item.tickets / maxVal) * 100;
          
          return (
            <div 
              key={idx} 
              className="flex flex-col items-center flex-1 mx-1 group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              id={`bar-group-${idx}`}
            >
              {/* Tooltip */}
              <div 
                className={`transition-all duration-200 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-md absolute -translate-y-24 pointer-events-none ${
                  hoveredIdx === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{ transform: `translateY(-${barHeight + 10}px)` }}
                id={`bar-tooltip-${idx}`}
              >
                {item.tickets} Sold
              </div>

              {/* Bar */}
              <div className="w-full bg-purple-50 rounded-t-md h-[200px] flex items-end overflow-hidden relative">
                <div 
                  className={`w-full rounded-t-md transition-all duration-700 ease-out ${
                    hoveredIdx === idx ? 'bg-purple-600' : 'bg-purple-500'
                  }`}
                  style={{ height: `${pct || 4}%` }}
                  id={`bar-fill-${idx}`}
                />
              </div>
              
              {/* Short label */}
              <span className="text-[10px] text-gray-500 font-medium mt-2 truncate w-full text-center" title={item.name} id={`bar-label-${idx}`}>
                {item.name.length > 10 ? item.name.slice(0, 8) + '..' : item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// LINE CHART (Bookings over last 7 days)
interface LineChartProps {
  data: { date: string; bookings: number }[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const maxVal = Math.max(...data.map(d => d.bookings), 5);
  const chartHeight = 150;
  const chartWidth = 500;
  
  // Calculate points
  const points = data.map((item, idx) => {
    const x = (idx / (data.length - 1 || 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (item.bookings / maxVal) * (chartHeight - 40) - 20;
    return { x, y, ...item };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z`
    : '';

  return (
    <div className="w-full overflow-x-auto">
      <div className="relative min-w-[320px] h-[180px]" id="line-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = (chartHeight - 40) * p + 15;
            return (
              <line 
                key={i} 
                x1="10" 
                y1={y} 
                x2={chartWidth - 10} 
                y2={y} 
                stroke="#F3F4F6" 
                strokeWidth="1" 
                strokeDasharray="4 4"
                id={`line-grid-${i}`}
              />
            );
          })}

          {/* Area under the line */}
          {areaD && (
            <path 
              d={areaD} 
              fill="url(#lineGradient)" 
              className="transition-all duration-700"
              id="line-chart-area"
            />
          )}

          {/* Line Path */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="#6C3EB8" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="transition-all duration-700"
              id="line-chart-path"
            />
          )}

          {/* Markers / Circles */}
          {points.map((p, idx) => (
            <g key={idx} id={`line-marker-group-${idx}`}>
              {/* Interaction zone */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="12" 
                fill="transparent" 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                id={`line-zone-${idx}`}
              />
              {/* Outer stroke glow */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={hoveredIdx === idx ? "7" : "5"} 
                fill="#FFD700" 
                stroke="#6C3EB8" 
                strokeWidth="2.5"
                className="transition-all duration-200 pointer-events-none"
                id={`line-glow-${idx}`}
              />
            </g>
          ))}

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C3EB8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6C3EB8" stopOpacity="0.01" />
            </linearGradient>
          </defs>
        </svg>

        {/* Dynamic HTML Tooltip overlay */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div 
            className="absolute z-10 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg pointer-events-none -translate-x-1/2 -translate-y-12 transition-all duration-150"
            style={{ 
              left: `${(points[hoveredIdx].x / chartWidth) * 100}%`, 
              top: `${(points[hoveredIdx].y / chartHeight) * 100}%` 
            }}
            id="line-tooltip"
          >
            <div className="font-semibold">{points[hoveredIdx].date}</div>
            <div>{points[hoveredIdx].bookings} Bookings</div>
          </div>
        )}
      </div>

      {/* Date Labels below chart */}
      <div className="flex justify-between px-4 mt-1 text-[10px] text-gray-400 font-medium" id="line-labels">
        {data.map((item, idx) => (
          <span key={idx} id={`line-label-text-${idx}`}>{item.date}</span>
        ))}
      </div>
    </div>
  );
};


// PIE CHART (Events by category)
interface PieChartProps {
  data: { category: string; count: number }[];
}

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  
  // Custom theme colors for categories
  const catColors: { [key: string]: string } = {
    Music: '#6C3EB8',     // Deep Purple
    Tech: '#3B82F6',      // Blue
    Sports: '#EF4444',    // Red
    Business: '#10B981',  // Green
    Education: '#F59E0B'  // Yellow/Orange
  };

  // Generate cumulative percentages for segments
  let cumulativePercent = 0;
  const segments = data.map((item, idx) => {
    const percent = item.count / total;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 360;
    
    // Polar coordinates helper
    const getCoordinatesForPercent = (percent: number) => {
      const x = Math.cos(2 * Math.PI * percent - Math.PI / 2);
      const y = Math.sin(2 * Math.PI * percent - Math.PI / 2);
      return [x, y];
    };

    const [startX, startY] = getCoordinatesForPercent(startAngle / 360);
    const [endX, endY] = getCoordinatesForPercent(endAngle / 360);
    
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    
    // SVG path string for pie slice (radius = 50)
    const pathData = percent === 1
      ? 'M 0 -50 A 50 50 0 1 1 -0.01 -50 Z'
      : `M 0 0 L ${startX * 50} ${startY * 50} A 50 50 0 ${largeArcFlag} 1 ${endX * 50} ${endY * 50} Z`;

    return {
      pathData,
      color: catColors[item.category] || '#9CA3AF',
      percent: Math.round(percent * 100),
      ...item
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-around gap-6" id="pie-chart-container">
      {/* SVG Pie Representation */}
      <div className="relative w-36 h-36">
        <svg viewBox="-55 -55 110 110" className="w-full h-full rotate-[-90deg]">
          {segments.map((slice, idx) => (
            <path
              key={idx}
              d={slice.pathData}
              fill={slice.color}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="transition-all duration-300 cursor-pointer hover:opacity-90 hover:scale-105 origin-center"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              id={`pie-slice-${idx}`}
            />
          ))}
          <circle cx="0" cy="0" r="22" fill="#FFFFFF" id="pie-donut-hole" /> {/* Donut hole style */}
        </svg>

        {/* Centered Hover Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" id="pie-center-label">
          {hoveredIdx !== null ? (
            <>
              <span className="text-xs font-bold text-gray-800" id="pie-center-cat">
                {segments[hoveredIdx].category}
              </span>
              <span className="text-[10px] text-purple-600 font-semibold" id="pie-center-pct">
                {segments[hoveredIdx].percent}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] text-gray-400 font-semibold">Total</span>
              <span className="text-sm font-bold text-gray-700">{total} Events</span>
            </>
          )}
        </div>
      </div>

      {/* Legend with exact count */}
      <div className="flex flex-col gap-2" id="pie-legends">
        {segments.map((slice, idx) => (
          <div 
            key={idx} 
            className={`flex items-center gap-2 px-2 py-1 rounded transition-colors duration-200 ${
              hoveredIdx === idx ? 'bg-gray-50' : ''
            }`}
            id={`pie-legend-item-${idx}`}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: slice.color }}
              id={`pie-legend-color-${idx}`}
            />
            <span className="text-xs text-gray-600 font-medium" id={`pie-legend-text-${idx}`}>
              {slice.category}: <span className="font-bold text-gray-800">{slice.count}</span> ({slice.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
