'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SurveyData } from '@/types';
import { CheckCircle, ClipboardList, Send } from 'lucide-react';

export interface SurveyResults {
  total_votes: number;
  votes: Record<string, number>;
  other_answers?: string[];
}

interface SurveyProps {
  surveyData: SurveyData;
  onComplete: (answer: string) => void;
  onCancel: () => void;
  results?: SurveyResults | null;
}

export function Survey({ surveyData, onComplete, onCancel, results }: SurveyProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isOtherSelected = selectedOption === '__other__';
  const canSubmit = selectedOption && (!isOtherSelected || otherText.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;

    const answer = isOtherSelected ? `other:${otherText.trim()}` : selectedOption!;
    setSubmitted(true);

    if (surveyData.show_results) {
      setShowResults(true);
    }

    // Delay to show confirmation/results screen before calling onComplete
    setTimeout(() => {
      onComplete(answer);
    }, surveyData.show_results ? 4000 : 2000);
  };

  // Results screen
  if (showResults && results) {
    const maxVotes = Math.max(...Object.values(results.votes), 1);

    return (
      <div className="p-6">
        <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-8 h-8 text-teal-400" />
        </div>

        <h3 className="text-lg font-bold text-white text-center mb-1">Wyniki ankiety</h3>
        <p className="text-dark-400 text-sm text-center mb-6">
          Łącznie głosów: {results.total_votes}
        </p>

        <div className="space-y-3 mb-6">
          {surveyData.options.map(option => {
            const voteCount = results.votes[option.id] || 0;
            const percentage = results.total_votes > 0
              ? Math.round((voteCount / results.total_votes) * 100)
              : 0;

            return (
              <div key={option.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{option.text}</span>
                  <span className="text-dark-400">{percentage}% ({voteCount})</span>
                </div>
                <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Other answers summary */}
          {surveyData.allow_other && results.other_answers && results.other_answers.length > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">Inne</span>
                <span className="text-dark-400">
                  {results.other_answers.length} odpowiedzi
                </span>
              </div>
              <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dark-500 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((results.other_answers.length / results.total_votes) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="animate-pulse text-dark-400 text-center text-sm">
          Zamykanie...
        </div>
      </div>
    );
  }

  // Confirmation screen (no results)
  if (submitted && !showResults) {
    return (
      <div className="p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Dziękujemy!</h3>
        <p className="text-dark-300">Twój głos został zapisany.</p>
        <div className="animate-pulse text-dark-400 mt-4 text-sm">
          Przetwarzanie...
        </div>
      </div>
    );
  }

  // Voting screen
  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-teal-400" />
          <span className="text-sm text-dark-400">Ankieta</span>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        <h3 className="text-lg font-semibold text-white mb-4">
          {surveyData.question}
        </h3>

        <div className="space-y-3 pb-4">
          {surveyData.options.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                'w-full p-3 text-left rounded-xl border-2 transition-all duration-200',
                selectedOption === option.id
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedOption === option.id
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-dark-500'
                  )}
                >
                  {selectedOption === option.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-white text-sm">{option.text}</span>
              </div>
            </button>
          ))}

          {/* Other option */}
          {surveyData.allow_other && (
            <div>
              <button
                onClick={() => setSelectedOption('__other__')}
                className={cn(
                  'w-full p-3 text-left rounded-xl border-2 transition-all duration-200',
                  isOtherSelected
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      isOtherSelected
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-dark-500'
                    )}
                  >
                    {isOtherSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-white text-sm">Inne (jakie?)</span>
                </div>
              </button>

              {isOtherSelected && (
                <textarea
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  placeholder="Wpisz swoją odpowiedź..."
                  className="w-full mt-2 bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none min-h-[60px] text-sm"
                  maxLength={500}
                  autoFocus
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 pt-2 border-t border-dark-700 bg-dark-800">
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1"
          >
            Wyślij głos
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
