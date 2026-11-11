// Pre-recorded Neural English Voiceover MP3 Player + WebAudio Marimba & Brush SFX
// Zero window.speechSynthesis usage.

export function createAudioSystem() {
  let ctx = null;
  let voiceEnabled = true;
  let sfxEnabled = true;
  let currentAudio = null;
  let lastVoiceId = 'welcome';
  let speaking = false;
  let replayCount = 0;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playNote(freq = 523.25, duration = 0.14, type = 'sine', gainVal = 0.12) {
    if (!sfxEnabled) return;
    const ac = ensureCtx();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(gainVal, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (_) {}
  }

  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  let noteIdx = 0;

  function playTraceTick() {
    const f = SCALE[noteIdx % SCALE.length];
    noteIdx += 1;
    playNote(f, 0.11, 'triangle', 0.08);
  }

  function playStepComplete() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => playNote(f, 0.18, 'triangle', 0.13), i * 65);
    });
  }

  function playFanfare() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      setTimeout(() => playNote(f, 0.25, 'sine', 0.15), i * 80);
    });
  }

  function speak(voiceId, onSubtitle) {
    if (!voiceId) return;
    lastVoiceId = voiceId;
    if (typeof onSubtitle === 'function') {
      onSubtitle(voiceId);
    }
    if (!voiceEnabled) return;
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      const audio = new Audio(`assets/voice/${voiceId}.mp3`);
      audio.volume = 0.92;
      currentAudio = audio;
      speaking = true;
      audio.onended = () => {
        if (currentAudio === audio) {
          speaking = false;
        }
      };
      audio.onerror = () => {
        speaking = false;
      };
      audio.play().catch(() => {
        speaking = false;
      });
    } catch (_) {
      speaking = false;
    }
  }

  function replayLast(onSubtitle) {
    voiceEnabled = true;
    replayCount += 1;
    speak(lastVoiceId, onSubtitle);
  }

  return {
    speak,
    replayLast,
    playTraceTick,
    playStepComplete,
    playFanfare,
    setVoiceEnabled(v) {
      voiceEnabled = Boolean(v);
      if (!voiceEnabled && currentAudio) {
        currentAudio.pause();
        speaking = false;
      }
    },
    getState() {
      return {
        voiceEnabled,
        sfxEnabled,
        speaking,
        lastVoiceId,
        replayCount,
      };
    },
  };
}
