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
    <div className="space-y-6">
      {/* Main Comparison Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-2xl font-bold">You Play Like a Pro!</h3>
        </div>

        {/* Primary Match */}
        <div className="bg-background/50 rounded-lg p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-magical flex items-center justify-center text-3xl">
                {primary.icon}
              </div>
              <div>
                <h4 className="text-2xl font-bold">{primary.name}</h4>
                <p className="text-muted-foreground">{primary.team} • {primary.role}</p>
                {primary.achievements && (
                  <Badge variant="outline" className="mt-1">
                    <Star className="w-3 h-3 mr-1" />
                    {primary.achievements}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-green-500">{similarity}%</div>
              <p className="text-sm text-muted-foreground">Match</p>
            </div>
          </div>

          <p className="text-muted-foreground italic mb-3">
            "{primary.playstyle}"
          </p>

          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000"
              style={{ width: `${similarity}%` }}
            />
          </div>
        </div>

        {/* Secondary Match */}
        <div className="bg-background/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl">
                {secondary.icon}
              </div>
              <div>
                <h5 className="font-semibold">{secondary.name}</h5>
                <p className="text-sm text-muted-foreground">{secondary.team}</p>
              </div>
            </div>
            <Badge variant="secondary">
              Runner-up
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-4 bg-background/30 rounded-lg">
          <p className="text-sm leading-relaxed">{description}</p>
        </div>
      </Card>

      {/* Playful Comparison */}
      {playfulComparison && (
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-orange-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">😄</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-2">The Real Talk</h4>
              <p className="text-lg italic">"{playfulComparison}"</p>
              <button 
                onClick={() => {
                  const text = `${playfulComparison}\n\nFind your League playstyle at RiftRewind!`;
                  navigator.clipboard.writeText(text);
                }}
                className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                📋 Copy to share
              </button>
            </div>
          </div>
        </Card>
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
                <div className="text-xs text-gray-500">/100</div>
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
                  <span className="text-orange-400 font-bold text-sm">{weakness.value}/100</span>
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
