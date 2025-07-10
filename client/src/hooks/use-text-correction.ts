import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface TextCorrection {
  correctedText: string;
  correctionsMade: boolean;
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'punctuation' | 'diacritics' | 'grammar';
  }>;
}

export function useTextCorrection() {
  const [isVisible, setIsVisible] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<TextCorrection | null>(null);

  const correctTextMutation = useMutation({
    mutationFn: async (text: string): Promise<TextCorrection> => {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to correct text');
      }
      
      return response.json();
    },
    onSuccess: (correction) => {
      setLastCorrection(correction);
      if (correction.correctionsMade) {
        setIsVisible(true);
      }
    },
  });

  const correctText = async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
      return text;
    }

    try {
      const correction = await correctTextMutation.mutateAsync(text);
      return correction.correctedText;
    } catch (error) {
      console.error('Text correction failed:', error);
      return text; // Return original text if correction fails
    }
  };

  const hideCorrections = () => {
    setIsVisible(false);
  };

  return {
    correctText,
    isLoading: correctTextMutation.isPending,
    isVisible,
    hideCorrections,
    lastCorrection,
    error: correctTextMutation.error,
  };
}