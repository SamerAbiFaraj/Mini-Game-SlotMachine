import React from 'react';
import ReelsPanel from './ReelsPanel';
import { GameState, GamePhase, ReelGrid as ReelGridType, LineWin } from '../types';

interface Props {
  grid: ReelGridType;
  gameState: GameState;
  wins: LineWin[];
  currentPhase: GamePhase;
  onSpinComplete?: () => void;
}

class ReelsPanelErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ReelsPanel error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when props change (new spin)
    if (this.state.hasError && prevProps.gameState !== this.props.gameState) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative max-w-2xl w-full aspect-[4/3] mx-auto my-4 md:my-6 z-20 bg-slate-900 rounded-xl flex items-center justify-center border-2 border-red-500">
          <div className="text-center p-4">
            <p className="text-red-400 mb-2">Error loading reels</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-cyan-500 text-black rounded"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return <ReelsPanel {...this.props} />;
  }
}

export default ReelsPanelErrorBoundary;
