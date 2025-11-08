import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, TrendingUp, AlertCircle } from 'lucide-react';
import type { ProPlayerProfile } from '@/lib/api';

interface ProComparisonProps {
  primary: ProPlayerProfile;
  secondary: ProPlayerProfile;
  similarity: number;
  description: string;
  playfulComparison?: string;
}

export function ProComparison({ 
  primary, 
  secondary, 
  similarity, 
  description,
  playfulComparison 
}: ProComparisonProps) {
  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Main Comparison Card */}
      <div className="lol-card p-4 sm:p-6 bg-gradient-to-br from-[#C8AA6E]/5 to-[#0A1428] border-[#C8AA6E]/30 relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8AA6E]/50 to-transparent" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#C8AA6E] flex-shrink-0" />
          <h3 className="text-xl sm:text-2xl font-bold lol-heading text-white">
            You Play Like a Pro!
          </h3>
        </div>

        {/* Primary Match */}
        <div className="bg-[#0A1428]/80 rounded-lg p-4 sm:p-6 mb-4 border border-[#C8AA6E]/20 relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#C8AA6E]/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#C8AA6E] to-[#F0E6D2] flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-[0_0_20px_rgba(200,170,110,0.3)]">
                  {primary.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl sm:text-2xl font-bold lol-heading text-white break-words">
                    {primary.name}
                  </h4>
                  <p className="text-gray-400 lol-body text-sm break-words">
                    {primary.team} • {primary.role}
                  </p>
                  {primary.achievements && (
                    <Badge variant="outline" className="mt-1 border-[#C8AA6E]/30 text-[#C8AA6E] text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      <span className="break-words">{primary.achievements}</span>
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-center sm:text-right flex-shrink-0">
                <div className="text-3xl sm:text-4xl font-bold text-[#C8AA6E] lol-heading" style={{ textShadow: "0 0 20px rgba(200, 170, 110, 0.5)" }}>
                  {similarity}%
                </div>
                <p className="text-xs sm:text-sm text-gray-500 lol-subheading">Match</p>
              </div>
            </div>

            <p className="text-gray-400 italic text-sm sm:text-base lol-body leading-relaxed break-words">
              "{primary.playstyle}"
            </p>

            <div className="h-2 bg-[#161f32] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#C8AA6E] to-[#F0E6D2] transition-all duration-1000"
                style={{ width: `${similarity}%` }}
              />
            </div>
          </div>
        </div>

        {/* Secondary Match */}
        <div className="bg-[#0A1428]/50 rounded-lg p-3 sm:p-4 border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                {secondary.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold lol-body text-white text-sm sm:text-base break-words">
                  {secondary.name}
                </h5>
                <p className="text-xs sm:text-sm text-gray-500 lol-subheading break-words">
                  {secondary.team}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gray-800 text-gray-400 text-xs flex-shrink-0">
              Runner-up
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-3 sm:p-4 bg-[#0A1428]/50 rounded-lg border border-gray-800">
          <p className="text-xs sm:text-sm leading-relaxed text-gray-300 lol-body break-words">
            {description}
          </p>
        </div>
      </div>

      {/* Playful Comparison */}
      {playfulComparison && (
        <div className="lol-card p-4 sm:p-6 bg-gradient-to-br from-orange-500/5 to-[#0A1428] border-orange-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <span className="text-xl">😄</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold mb-2 lol-heading text-white text-base sm:text-lg">
                The Real Talk
              </h4>
              <p className="text-base sm:text-lg italic lol-body text-gray-300 leading-relaxed break-words">
                "{playfulComparison}"
              </p>
              <button 
                onClick={() => {
                  const text = `${playfulComparison}\n\nFind your League playstyle at RiftRewind!`;
                  navigator.clipboard.writeText(text);
                }}
                className="mt-3 text-xs sm:text-sm text-gray-500 hover:text-[#C8AA6E] transition-colors lol-subheading"
              >
                📋 Copy to share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StrengthsWeaknessesProps {
  topStrengths: Array<{ metric: string; value: number; percentile: number }>;
  needsWork: Array<{ metric: string; value: number; suggestion: string }>;
}

export function StrengthsWeaknesses({ topStrengths, needsWork }: StrengthsWeaknessesProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Strengths */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#C8AA6E]" />
          <h3 className="text-lg font-bold lol-heading text-[#C8AA6E]">Your Superpowers</h3>
        </div>
        <div className="space-y-3">
          {topStrengths.map((strength, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-gray-300">{strength.metric}</p>
                <p className="text-xs text-gray-500">
                  Top {100 - strength.percentile}% of players
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[#C8AA6E]">{strength.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weaknesses */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <h3 className="text-lg font-bold lol-heading text-[#C8AA6E]">Room to Grow</h3>
        </div>
        <div className="space-y-3">
          {needsWork.length === 0 ? (
            <p className="text-gray-400 text-sm">No major weaknesses detected! Keep it up!</p>
          ) : (
            needsWork.map((weakness, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-300">{weakness.metric}</p>
                  <span className="text-orange-400 font-bold text-sm">{weakness.value}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {weakness.suggestion}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
