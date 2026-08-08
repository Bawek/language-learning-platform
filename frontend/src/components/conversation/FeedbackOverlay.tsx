'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react'
import type { MessageFeedback } from '@/types'

interface FeedbackOverlayProps {
  feedback: MessageFeedback
  onDismiss: () => void
  autoDismissMs?: number
}

export function FeedbackOverlay({
  feedback,
  onDismiss,
  autoDismissMs = 8000,
}: FeedbackOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), autoDismissMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismissMs])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 300)
  }

  const hasFeedback =
    (feedback.corrections && feedback.corrections.length > 0) ||
    (feedback.suggestions && feedback.suggestions.length > 0) ||
    feedback.pronunciation_score != null

  if (!hasFeedback) return null

  return (
    <div
      className={`fixed top-20 right-4 w-80 max-h-[80vh] overflow-y-auto z-50 transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      role="complementary"
      aria-label="Language feedback"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-gray-900 text-sm">Language Feedback</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/60 rounded-lg transition-colors"
            aria-label="Dismiss feedback"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Pronunciation Score */}
          {feedback.pronunciation_score != null && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pronunciation
                </span>
                <span
                  className={`text-sm font-bold ${
                    feedback.pronunciation_score >= 80
                      ? 'text-emerald-600'
                      : feedback.pronunciation_score >= 60
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {feedback.pronunciation_score}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    feedback.pronunciation_score >= 80
                      ? 'bg-emerald-500'
                      : feedback.pronunciation_score >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${feedback.pronunciation_score}%` }}
                  role="progressbar"
                  aria-valuenow={feedback.pronunciation_score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Grammar Corrections */}
          {feedback.corrections && feedback.corrections.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Corrections ({feedback.corrections.length})
                </span>
              </div>
              <div className="space-y-2.5">
                {feedback.corrections.map((correction, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-3 text-sm border border-gray-100"
                  >
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-red-500 line-through text-xs bg-red-50 px-2 py-0.5 rounded">
                        {correction.original}
                      </span>
                      <span className="text-gray-400 text-xs pt-0.5">→</span>
                      <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded">
                        {correction.corrected}
                      </span>
                    </div>
                    {correction.explanation && (
                      <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                        {correction.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggestions
                </span>
              </div>
              <ul className="space-y-1.5">
                {feedback.suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100"
                  >
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-0.5 bg-indigo-400"
            style={{
              animation: `shrink ${autoDismissMs}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
