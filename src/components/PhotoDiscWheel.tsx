import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera, Plus, Trash2, Check, X, Sparkles, Disc } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { openImagePicker } from '../utils/imageUtils';
import { uploadImageToBackend, syncUserPhotosToBackend } from '../services/apiSync';

export interface PhotoDiscWheelProps {
  storageKey: string; // e.g. 'mantra_reel' or 'header_reel'
  title: string;
  activePhoto: string;
  defaultPhotos: string[];
  onSelectPhoto: (photoUrl: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'mini';
  isOpenModal?: boolean;
  onCloseModal?: () => void;
  userId?: string;
}

// 6 slot positions matching the custom 6-hole disc wheel geometry
const HOLE_POSITIONS = [
  { top: '17%', left: '50%', label: '1' },        // 0° (Top)
  { top: '33.5%', left: '78.6%', label: '2' },    // 60° (Top-Right)
  { top: '66.5%', left: '78.6%', label: '3' },    // 120° (Bottom-Right)
  { top: '83%', left: '50%', label: '4' },        // 180° (Bottom)
  { top: '66.5%', left: '21.4%', label: '5' },    // 240° (Bottom-Left)
  { top: '33.5%', left: '21.4%', label: '6' },    // 300° (Top-Left)
];

export const PhotoDiscWheel: React.FC<PhotoDiscWheelProps> = ({
  storageKey,
  title,
  activePhoto,
  defaultPhotos,
  onSelectPhoto,
  className = '',
  size = 'md',
  isOpenModal: externalModalOpen,
  onCloseModal: externalCloseModal,
  userId = 'local_authenticated_dev_user',
}) => {
  // 6 Slots State
  const [slots, setSlots] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`effstreak_reel_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) return parsed;
      }
    } catch { /* ignore */ }
    return Array.from({ length: 6 }, (_, i) => defaultPhotos[i] || (i === 0 ? activePhoto : ''));
  });

  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(() => {
    const idx = slots.findIndex((s) => s && s === activePhoto);
    return idx !== -1 ? idx : 0;
  });

  // Current Disc Physical Rotation Angle (in degrees)
  const [rotationAngle, setRotationAngle] = useState<number>(() => {
    const idx = slots.findIndex((s) => s && s === activePhoto);
    return idx !== -1 ? -idx * 60 : 0;
  });

  const [isManagerOpen, setIsManagerOpen] = useState<boolean>(false);
  const [_editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const lastClickTimeRef = useRef<{ slot: number; time: number }>({ slot: -1, time: 0 });

  // Sync to local storage & backend
  useEffect(() => {
    try {
      localStorage.setItem(`effstreak_reel_${storageKey}`, JSON.stringify(slots));
      // Save reel in backend and Supabase
      if (storageKey === 'mantra_reel') {
        syncUserPhotosToBackend(userId, { mantraReel: slots, dailyMantraImage: activePhoto }).catch(() => {});
      } else if (storageKey === 'header_reel') {
        syncUserPhotosToBackend(userId, { headerReel: slots, headerImage: activePhoto }).catch(() => {});
      }
    } catch { /* ignore */ }
  }, [slots, storageKey, activePhoto, userId]);

  // Keep active photo in slot 0 if not present
  useEffect(() => {
    if (activePhoto && !slots.includes(activePhoto)) {
      setSlots((prev) => {
        const next = [...prev];
        next[activeSlotIndex] = activePhoto;
        return next;
      });
    }
  }, [activePhoto]);

  // Handle Single Click -> Switch Photo & Spin Disc
  const handleSlotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const isDoubleClick = lastClickTimeRef.current.slot === index && now - lastClickTimeRef.current.time < 350;
    lastClickTimeRef.current = { slot: index, time: now };

    if (isDoubleClick) {
      // Double Click -> Open Add / Change Photo Manager for this slot
      soundFx.playLevelUp();
      setEditingSlotIndex(index);
      setIsManagerOpen(true);
      return;
    }

    const photoUrl = slots[index];
    if (photoUrl) {
      soundFx.playClick();
      setActiveSlotIndex(index);
      // Spin the wheel smoothly so selected slot aligns at top
      setRotationAngle(-index * 60);
      onSelectPhoto(photoUrl);
    } else {
      // Empty slot clicked -> directly open upload picker for this hole
      handleUploadForSlot(index);
    }
  };

  // Next / Prev spin
  const handleSpinStep = (direction: 1 | -1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundFx.playClick();
    const nextIndex = (activeSlotIndex + direction + 6) % 6;
    setActiveSlotIndex(nextIndex);
    setRotationAngle((prev) => prev - direction * 60);
    const photoUrl = slots[nextIndex];
    if (photoUrl) {
      onSelectPhoto(photoUrl);
    }
  };

  // Change / Upload photo for a specific slot (.jpg conversion & backend storage)
  const handleUploadForSlot = (slotIdx: number) => {
    soundFx.playClick();
    openImagePicker(
      async (dataUrl) => {
        // Immediate visual update
        setSlots((prev) => {
          const next = [...prev];
          next[slotIdx] = dataUrl;
          return next;
        });
        setActiveSlotIndex(slotIdx);
        setRotationAngle(-slotIdx * 60);
        onSelectPhoto(dataUrl);
        soundFx.playLevelUp();

        // Convert & upload as genuine .jpg to backend database
        try {
          const uploadRes = await uploadImageToBackend(dataUrl, `${storageKey}_slot${slotIdx + 1}`, 'reel_photo', userId);
          if (uploadRes && uploadRes.url) {
            const jpgUrl = uploadRes.url;
            setSlots((prev) => {
              const next = [...prev];
              next[slotIdx] = jpgUrl;
              return next;
            });
            onSelectPhoto(jpgUrl);

            // Persist to user profile
            if (storageKey === 'mantra_reel') {
              syncUserPhotosToBackend(userId, { dailyMantraImage: jpgUrl });
            } else if (storageKey === 'header_reel') {
              syncUserPhotosToBackend(userId, { headerImage: jpgUrl });
            }
          }
        } catch (err) {
          console.warn('Backend image upload notice:', err);
        }
      },
      (err) => console.warn('Photo disc image error:', err)
    );
  };

  // Direct Add / Change photo for current active slot
  const handleDirectAddPhoto = () => {
    const targetSlot = slots[activeSlotIndex]
      ? activeSlotIndex
      : slots.findIndex((s) => !s) !== -1
      ? slots.findIndex((s) => !s)
      : activeSlotIndex;
    handleUploadForSlot(targetSlot);
  };

  // Remove photo from a slot
  const handleRemoveFromSlot = (slotIdx: number) => {
    soundFx.playUncheck();
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = '';
      return next;
    });
    // If we removed the active photo, find first available photo
    if (slotIdx === activeSlotIndex) {
      const firstAvail = slots.findIndex((s, i) => i !== slotIdx && Boolean(s));
      if (firstAvail !== -1 && slots[firstAvail]) {
        setActiveSlotIndex(firstAvail);
        setRotationAngle(-firstAvail * 60);
        onSelectPhoto(slots[firstAvail]);
      }
    }
  };

  const isModalVisible = externalModalOpen !== undefined ? externalModalOpen : isManagerOpen;
  const closeModal = () => {
    setIsManagerOpen(false);
    externalCloseModal?.();
    setEditingSlotIndex(null);
  };

  // Dimension classes
  const sizeClasses = {
    mini: 'w-24 h-24',
    sm: 'w-36 h-36',
    md: 'w-52 h-52 sm:w-60 sm:h-60',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
  }[size];

  const holeSizeClasses = {
    mini: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-11 h-11 sm:w-13 sm:h-13',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  }[size];

  return (
    <>
      {/* 🎡 Disc Reel Physical Interactive Body */}
      <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
        {/* Top Active Indicator Pointer Beacon */}
        <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shadow-lg shadow-rose-500/50" />
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-rose-500 -mt-1 drop-shadow-md" />
        </div>

        {/* Rotating Wheel Container */}
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            soundFx.playLevelUp();
            setIsManagerOpen(true);
          }}
          title="Single click to switch photo • Double click to Add / Remove photos"
          className={`relative ${sizeClasses} rounded-full cursor-pointer group shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          {/* 1. Underlying 6 Circular Photo Apertures (Fit precisely under the 6 holes) */}
          {HOLE_POSITIONS.map((pos, idx) => {
            const photoUrl = slots[idx];
            const isActive = idx === activeSlotIndex;

            return (
              <div
                key={`slot-${idx}`}
                onClick={(e) => handleSlotClick(idx, e)}
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute ${holeSizeClasses} rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 z-10 ${
                  isActive
                    ? 'ring-2 ring-rose-500 shadow-md scale-105'
                    : 'hover:scale-108 hover:ring-1 hover:ring-amber-400'
                } ${photoUrl ? 'bg-slate-900' : 'bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-400'}`}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Reel Slot ${idx + 1}`}
                    className="w-full h-full object-cover rounded-full pointer-events-none transition-transform duration-500 group-hover:scale-105"
                    style={{
                      // Counter-rotate the image preview so thumbnail stays upright
                      transform: `rotate(${-rotationAngle}deg)`,
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadForSlot(idx);
                    }}
                    className="w-full h-full flex flex-col items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[7px] font-mono font-bold leading-none">{pos.label}</span>
                  </button>
                )}

                {/* Active Indicator Halo */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500 pointer-events-none animate-pulse" />
                )}
              </div>
            );
          })}

          {/* 2. Realistic Custom View-Master Reel Disc Frame Layer */}
          <img
            src="/images/disc_reel.png"
            alt="ViewMaster Rotating Disc Reel"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xl z-20"
          />
        </div>

        {/* Bottom Interactive Dial Controls: Add Photo, Remove Photo, Navigation */}
        <div className="flex items-center justify-center gap-1.5 mt-2 z-30 flex-wrap">
          {/* Previous / Next Slot Navigation */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 dark:bg-black/90 p-0.5 rounded-xl border border-white/20 shadow-xs">
            <button
              type="button"
              onClick={(e) => handleSpinStep(-1, e)}
              title="Previous Slot in Reel"
              className="p-1 rounded-lg text-white hover:bg-rose-600 transition-all hover:scale-110 cursor-pointer flex items-center justify-center"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="text-[10px] font-mono font-black px-1.5 text-white">
              Slot {activeSlotIndex + 1}/6
            </span>

            <button
              type="button"
              onClick={(e) => handleSpinStep(1, e)}
              title="Next Slot in Reel"
              className="p-1 rounded-lg text-white hover:bg-rose-600 transition-all hover:scale-110 cursor-pointer flex items-center justify-center"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ➕ Direct Add / Replace Photo to Disc */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDirectAddPhoto();
            }}
            title="Upload / Add Photo to this Disc Slot"
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 border border-emerald-400/80 shadow-xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
          >
            <Plus className="w-3 h-3" />
            <span>Add Photo</span>
          </button>

          {/* 🗑️ Direct Remove Photo from Disc */}
          {slots[activeSlotIndex] && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromSlot(activeSlotIndex);
              }}
              title="Remove Photo from this Slot on Disc"
              className="px-2 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-700 text-rose-200 hover:text-white border border-rose-600/60 shadow-xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Remove</span>
            </button>
          )}

          {/* ⚙️ Manage 6 Slots Modal Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playClick();
              setIsManagerOpen(true);
            }}
            title="View & Manage all 6 Disc Slots"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-xs transition-all hover:scale-105 cursor-pointer flex items-center justify-center"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 🛠️ 6-Slot Photo Manager Modal (Opened on Double Click or Camera Button) */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-md">
                  <Disc className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{title} Disc Reel</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold">
                      6 Slots
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any slot to select, change photo, or clear slot
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 6 Slot Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {slots.map((photoUrl, idx) => {
                const isActive = idx === activeSlotIndex;

                return (
                  <div
                    key={`manage-slot-${idx}`}
                    className={`p-2.5 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-2 relative ${
                      isActive
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300'
                    }`}
                  >
                    {/* Slot Badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono bg-slate-900/80 text-white backdrop-blur-md">
                      Slot {idx + 1}
                    </span>

                    {/* Active Check Indicator */}
                    {isActive && (
                      <span className="absolute top-2 right-2 p-1 rounded-full bg-rose-600 text-white shadow-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}

                    {/* Thumbnail */}
                    <div
                      onClick={() => {
                        if (photoUrl) {
                          soundFx.playClick();
                          setActiveSlotIndex(idx);
                          setRotationAngle(-idx * 60);
                          onSelectPhoto(photoUrl);
                        } else {
                          handleUploadForSlot(idx);
                        }
                      }}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative group cursor-pointer mt-4"
                    >
                      {photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={`Slot ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            Select
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 bg-slate-100 dark:bg-slate-800">
                          <Plus className="w-6 h-6" />
                          <span className="text-[9px] font-bold mt-1">Add Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Action Controls for this Slot */}
                    <div className="flex items-center gap-1.5 w-full pt-1">
                      <button
                        type="button"
                        onClick={() => handleUploadForSlot(idx)}
                        className="flex-1 text-[10px] font-bold py-1 px-2 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{photoUrl ? 'Replace' : 'Upload'}</span>
                      </button>

                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFromSlot(idx)}
                          title="Remove Photo from this Slot"
                          className="p-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer / Tip */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Double-click on the disc anytime to open this manager.
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:brightness-110 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
