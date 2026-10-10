import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Gamepad2,
  Minus,
  Plus
} from 'lucide-react';
import { MatchFixture, UserProfile } from '../types/tournament';
import { SAMPLE_MATCH_SCREENSHOT } from '../services/mockData';

interface ResultSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixtures: MatchFixture[];
  selectedFixture?: MatchFixture | null;
  currentUser: UserProfile;
  onSubmitResult: (
    fixtureId: string, 
    data: { 
      player1Score: number; 
      player2Score: number; 
      screenshotUrlOrBase64: string; 
      notes?: string; 
    }
  ) => Promise<void>;
}

export const ResultSubmissionModal: React.FC<ResultSubmissionModalProps> = ({
  isOpen,
  onClose,
  fixtures,
  selectedFixture,
  currentUser,
  onSubmitResult
}) => {
  const [activeFixtureId, setActiveFixtureId] = useState<string>(
    selectedFixture?.id || ''
  );
  const [myGoal, setMyGoal] = useState<number>(2);
  const [oppGoal, setOppGoal] = useState<number>(1);
  const [screenshotData, setScreenshotData] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when selectedFixture or activeFixtureId changes
  React.useEffect(() => {
    if (selectedFixture) {
      setActiveFixtureId(selectedFixture.id);
    } else if (fixtures.length > 0 && !activeFixtureId) {
      setActiveFixtureId(fixtures[0].id);
    }
  }, [selectedFixture, fixtures]);

  React.useEffect(() => {
    const fixture = fixtures.find(f => f.id === activeFixtureId);
    if (fixture && fixture.result) {
      const isUserP1 = fixture.player1.id === currentUser.id;
      setMyGoal(isUserP1 ? fixture.result.player1Score : fixture.result.player2Score);
      setOppGoal(isUserP1 ? fixture.result.player2Score : fixture.result.player1Score);
      setScreenshotData(fixture.result.screenshotUrl || '');
      setNotes(fixture.result.notes || '');
    } else {
      setMyGoal(2);
      setOppGoal(1);
      setScreenshotData('');
      setNotes('');
    }
    setErrorMessage('');
  }, [activeFixtureId, fixtures, currentUser.id]);

  if (!isOpen) return null;

  const currentFixture = fixtures.find(f => f.id === activeFixtureId) || fixtures[0];
  const isUserP1 = currentFixture?.player1.id === currentUser.id;
  const isUserP2 = currentFixture?.player2.id === currentUser.id;

  const opponentName = isUserP1 
    ? currentFixture?.player2.name 
    : isUserP2 
    ? currentFixture?.player1.name 
    : 'Opponent';

  const opponentId = isUserP1 
    ? currentFixture?.player2.efootballId 
    : isUserP2 
    ? currentFixture?.player1.efootballId 
    : 'Opponent ID';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setScreenshotData(reader.result as string);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setScreenshotData(reader.result as string);
          setErrorMessage('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleScreenshot = () => {
    setScreenshotData(SAMPLE_MATCH_SCREENSHOT);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFixture) {
      setErrorMessage('Please select a fixture first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Map "My Goal" and "Opponent Goal" to player1 and player2 scores
      let player1Score = myGoal;
      let player2Score = oppGoal;
      if (isUserP2) {
        player1Score = oppGoal;
        player2Score = myGoal;
      }

      await onSubmitResult(currentFixture.id, {
        player1Score,
        player2Score,
        screenshotUrlOrBase64: screenshotData || '',
        notes
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit match result.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-r from-[#00ff87] to-[#00e5ff] p-1.5 text-slate-950">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Submit Match Result
              </h2>
              <p className="text-[11px] text-[#00ff87]">
                স্কোর দিন • ফটো দেওয়া সম্পূর্ণ অপশনাল (ছবি ছাড়াও সাবমিট করা যাবে)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Select Fixture */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Match Fixture
            </label>
            <select
              value={activeFixtureId}
              onChange={(e) => setActiveFixtureId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs sm:text-sm font-semibold text-white focus:border-[#00ff87] focus:outline-none"
            >
              {fixtures.map(f => (
                <option key={f.id} value={f.id}>
                  {f.round}: {f.player1.name} vs {f.player2.name} ({f.scheduledTime})
                </option>
              ))}
            </select>
          </div>

          {/* Match Scoreboard Counters */}
          {currentFixture && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Full-Time Final Score
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                
                {/* My Goals */}
                <div className="rounded-xl border border-[#00ff87]/30 bg-slate-900/90 p-3 text-center space-y-2">
                  <span className="block text-xs font-bold text-[#00ff87] truncate">
                    {currentUser.name} (You)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMyGoal(Math.max(0, myGoal - 1))}
                      className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={myGoal}
                      onChange={(e) => setMyGoal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-center text-2xl font-black text-white bg-transparent focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setMyGoal(myGoal + 1)}
                      className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="block text-[10px] text-slate-500 font-mono">
                    Goals Scored
                  </span>
                </div>

                {/* Opponent Goals */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-center space-y-2">
                  <span className="block text-xs font-bold text-slate-300 truncate">
                    {opponentName}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOppGoal(Math.max(0, oppGoal - 1))}
                      className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={oppGoal}
                      onChange={(e) => setOppGoal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-center text-2xl font-black text-white bg-transparent focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setOppGoal(oppGoal + 1)}
                      className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="block text-[10px] text-slate-500 font-mono">
                    Goals Conceded
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* Screenshot Upload Dropzone (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Match Screenshot Proof
                </label>
                <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-slate-400">
                  Optional / অপশনাল
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseSampleScreenshot}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00e5ff] hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>Use Sample</span>
              </button>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition ${
                screenshotData
                  ? 'border-[#00ff87]/60 bg-emerald-950/20'
                  : 'border-slate-700 bg-slate-950 hover:border-[#00ff87]/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {screenshotData ? (
                <div className="space-y-2">
                  <img
                    src={screenshotData}
                    alt="Uploaded result preview"
                    className="mx-auto max-h-44 w-auto rounded-xl object-contain border border-slate-700"
                  />
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#00ff87]">
                    <Check className="w-4 h-4" />
                    <span>Screenshot attached (Optional)</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScreenshotData('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-xs text-rose-300 hover:bg-rose-500/30"
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      Tap or drag match screenshot here (Optional / ইচ্ছা হলে দিতে পারেন)
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      ছবি না দিয়েও স্কোর সাবমিট করা যাবে
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Match Remarks / Extra Time Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Won on penalties 4-3, intense 90th minute winner..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00ff87] focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#00e5ff] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00ff87]/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>{screenshotData ? 'Uploading & Submitting...' : 'Submitting Score...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{screenshotData ? 'Submit Result (With Screenshot)' : 'Submit Score (Without Photo / ছবি ছাড়া)'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
