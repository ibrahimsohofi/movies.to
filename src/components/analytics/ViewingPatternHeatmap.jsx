import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ViewingPatternHeatmap({ data = [] }) {
  // Transform viewing patterns data into a 7x24 matrix
  const heatmapData = useMemo(() => {
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxCount = 0;

    data.forEach((item) => {
      const day = item.day_of_week || 0;
      const hour = item.hour_of_day || 0;
      const count = item.view_count || 0;

      if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
        matrix[day][hour] = count;
        if (count > maxCount) maxCount = count;
      }
    });

    return { matrix, maxCount };
  }, [data]);

  const getIntensity = (count) => {
    if (count === 0 || heatmapData.maxCount === 0) return 0;
    return Math.max(0.1, count / heatmapData.maxCount);
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };

  const getTotalForDay = (dayIndex) => {
    return heatmapData.matrix[dayIndex].reduce((sum, count) => sum + count, 0);
  };

  const getPeakTime = () => {
    let maxDay = 0;
    let maxHour = 0;
    let maxValue = 0;

    heatmapData.matrix.forEach((day, dayIndex) => {
      day.forEach((count, hourIndex) => {
        if (count > maxValue) {
          maxValue = count;
          maxDay = dayIndex;
          maxHour = hourIndex;
        }
      });
    });

    if (maxValue === 0) return null;
    return { day: DAYS[maxDay], hour: formatHour(maxHour), count: maxValue };
  };

  const peakTime = getPeakTime();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Viewing Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No viewing pattern data available yet. Start watching movies to see your habits!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          Viewing Patterns
        </CardTitle>
        {peakTime && (
          <p className="text-sm text-muted-foreground">
            Peak viewing time: <span className="font-medium text-foreground">{peakTime.day} at {peakTime.hour}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex mb-1">
                <div className="w-12" /> {/* Spacer for day labels */}
                {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
                  <div
                    key={hour}
                    className="text-[10px] text-muted-foreground"
                    style={{ width: `${(100 / 8)}%` }}
                  >
                    {formatHour(hour)}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="space-y-1">
                {DAYS.map((day, dayIndex) => (
                  <div key={day} className="flex items-center gap-1">
                    <div className="w-10 text-xs text-muted-foreground text-right pr-2">
                      {day}
                    </div>
                    <div className="flex-1 flex gap-[2px]">
                      {HOURS.map((hour) => {
                        const count = heatmapData.matrix[dayIndex][hour];
                        const intensity = getIntensity(count);

                        return (
                          <Tooltip key={`${dayIndex}-${hour}`}>
                            <TooltipTrigger asChild>
                              <div
                                className="flex-1 aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110 hover:z-10"
                                style={{
                                  backgroundColor: count > 0
                                    ? `rgba(168, 85, 247, ${intensity})`
                                    : 'rgba(156, 163, 175, 0.1)',
                                  minWidth: '12px',
                                  minHeight: '12px',
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{day} at {formatHour(hour)}</p>
                              <p className="text-sm text-muted-foreground">
                                {count} {count === 1 ? 'movie' : 'movies'} watched
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <div className="w-12 text-xs text-muted-foreground pl-2">
                      {getTotalForDay(dayIndex)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-[2px]">
                  {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: intensity === 0
                          ? 'rgba(156, 163, 175, 0.1)'
                          : `rgba(168, 85, 247, ${intensity})`,
                      }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
