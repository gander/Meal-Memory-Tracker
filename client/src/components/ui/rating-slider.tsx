import { Slider } from "@/components/ui/slider";

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function RatingSlider({ label, value, onChange }: RatingSliderProps) {
  const getValueColor = (val: number) => {
    if (val > 1) return "text-green-600";
    if (val < 0) return "text-red-500";
    return "text-gray-500";
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-neutral-700 w-32">{label}</span>
      <div className="flex items-center space-x-4 flex-1">
        <span className="text-sm text-red-500 w-6 text-center">-3</span>
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={-3}
          max={3}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-green-600 w-6 text-center">+3</span>
        <span className={`w-8 text-center font-medium ${getValueColor(value)}`}>
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
    </div>
  );
}
