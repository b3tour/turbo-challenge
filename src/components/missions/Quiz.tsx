'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { QuizData, QuizQuestion } from '@/types';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

interface QuizProps {
  quizData: QuizData;
  onComplete: (answers: Record<string, string>) => void;
  onCancel: () => void;
}

export function Quiz({ quizData, onComplete, onCancel }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizData.time_limit || 0);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;
  const hasTimeLimit = quizData.time_limit && quizData.time_limit > 0;

  // Timer
  useEffect(() => {
    if (!hasTimeLimit || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Czas się skończył - wyślij odpowiedzi
          onComplete(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasTimeLimit, showResult, answers, onComplete]);

  const handleAnswerSelect = (answerId: string) => {
    if (showResult) return;
    setSelectedAnswer(answerId);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    // Zapisz odpowiedź
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: selectedAnswer,
    };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Quiz zakończony
      setShowResult(true);
      setTimeout(() => {
        onComplete(newAnswers);
      }, 2000);
    } else {
      // Następne pytanie
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswerClass = (answerId: string, isCorrect: boolean) => {
    if (!showResult) {
      return selectedAnswer === answerId
        ? 'border-turbo-500 bg-turbo-500/10'
        : 'border-dark-600 hover:border-dark-500';
    }

    if (isCorrect) {
      return 'border-green-500 bg-green-500/10';
    }

    if (selectedAnswer === answerId && !isCorrect) {
      return 'border-red-500 bg-red-500/10';
    }

    return 'border-dark-600 opacity-50';
  };

  if (showResult) {
    const correctCount = quizData.questions.filter(q => {
      const userAnswer = answers[q.id];
      const correctAnswer = q.answers.find(a => a.is_correct);
      return userAnswer === correctAnswer?.id;
    }).length;

    const score = Math.round((correctCount / quizData.questions.length) * 100);
    const passed = score >= quizData.passing_score;

    return (
      <div className="p-6 text-center">
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
            passed ? 'bg-green-500/20' : 'bg-red-500/20'
          )}
        >
          {passed ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <XCircle className="w-10 h-10 text-red-500" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          {passed ? 'Gratulacje!' : 'Spróbuj ponownie'}
        </h3>

        <p className="text-dark-300 mb-4">
          Twój wynik: <span className="font-bold text-white">{score}%</span>
        </p>

        <p className="text-sm text-dark-400 mb-6">
          Poprawne odpowiedzi: {correctCount} z {quizData.questions.length}
          <br />
          Wymagane: {quizData.passing_score}%
        </p>

        <div className="animate-pulse text-dark-400">
          Przetwarzanie wyników...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header z postępem i czasem */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-400">Pytanie</span>
          <span className="font-bold text-white">
            {currentQuestionIndex + 1}/{quizData.questions.length}
          </span>
        </div>

        {hasTimeLimit && (
          <div
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full',
              timeLeft <= 30 ? 'bg-red-500/20 text-red-400' : 'bg-dark-700 text-dark-300'
            )}
          >
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Pasek postępu */}
      <div className="h-1.5 bg-dark-700 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-turbo-500 transition-all duration-300"
          style={{
            width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Pytanie */}
      <h3 className="text-lg font-semibold text-white mb-6">
        {currentQuestion.question}
      </h3>

      {/* Odpowiedzi */}
      <div className="space-y-3 mb-6">
        {currentQuestion.answers.map(answer => (
          <button
            key={answer.id}
            onClick={() => handleAnswerSelect(answer.id)}
            className={cn(
              'w-full p-4 text-left rounded-xl border-2 transition-all duration-200',
              getAnswerClass(answer.id, answer.is_correct)
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  selectedAnswer === answer.id
                    ? 'border-turbo-500 bg-turbo-500'
                    : 'border-dark-500'
                )}
              >
                {selectedAnswer === answer.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-white">{answer.text}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Przyciski */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Anuluj
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="flex-1"
        >
          {isLastQuestion ? 'Zakończ' : 'Dalej'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
