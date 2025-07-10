import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TextCorrectionIndicatorProps {
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'punctuation' | 'diacritics' | 'grammar';
  }>;
  isVisible: boolean;
  onHide: () => void;
}

const correctionTypeLabels = {
  spelling: 'Literówka',
  punctuation: 'Interpunkcja',
  diacritics: 'Znaki diakrytyczne',
  grammar: 'Gramatyka',
};

const correctionTypeColors = {
  spelling: 'bg-red-100 text-red-800',
  punctuation: 'bg-blue-100 text-blue-800',
  diacritics: 'bg-green-100 text-green-800',
  grammar: 'bg-purple-100 text-purple-800',
};

export default function TextCorrectionIndicator({
  corrections,
  isVisible,
  onHide,
}: TextCorrectionIndicatorProps) {
  if (!isVisible || corrections.length === 0) {
    return null;
  }

  return (
    <Card className="mt-2 border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-amber-600" />
            Tekst został poprawiony automatycznie
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHide}
            className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-xs text-amber-700">
            Znalezione poprawki ({corrections.length}):
          </p>
          <div className="space-y-1">
            {corrections.map((correction, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge className={correctionTypeColors[correction.type]}>
                    {correctionTypeLabels[correction.type]}
                  </Badge>
                  <span className="text-gray-600">
                    "{correction.original}" → "{correction.corrected}"
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}