"use client";
import React, { useMemo, useState } from 'react';
import { ALLOWED_ACTIVITY_TYPES, CheckinPayload, checkinApi } from '@/services/checkin-api';

type Props = {
  defaultDate?: string; // YYYY-MM-DD
  onSaved: (result: { percent: number; values?: CheckinPayload }) => void;
  onCancel: () => void;
  mode?: 'daily' | 'baseline'; // baseline일 때는 API 호출 없이 값만 전달
};

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

function Slider({ label, value, setValue }: { label: string; value: number; setValue: (v: number) => void }) {
  return (
    <div className="mb-3">
      <div className="text-sm mb-1">{label}</div>
      <input type="range" min={1} max={10} value={value} onChange={(e) => setValue(parseInt(e.target.value))} className="w-full" />
      <div className="text-[11px] text-gray-600">{value}</div>
    </div>
  );
}

export default function CheckinForm({ defaultDate, onSaved, onCancel, mode = 'daily' }: Props) {
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState(6); // 1~9 (9=9+)
  const [sleepQuality, setSleepQuality] = useState(6);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [workoutIntensity, setWorkoutIntensity] = useState(0);
  const [focus, setFocus] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [socialCount, setSocialCount] = useState(5);
  const [socialSatisfaction, setSocialSatisfaction] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsIntensity = activityTypes.includes('운동');
  const hoursList = range(9); // 1..9

  const canSubmit = useMemo(() => {
    const required = [mood, energy, stress, sleepHours, sleepQuality, focus, fatigue, socialCount, socialSatisfaction];
    const baseOk = required.every((v) => v >= 1);
    const actOk = Array.isArray(activityTypes);
    const intensityOk = needsIntensity ? workoutIntensity >= 1 : true;
    return baseOk && actOk && intensityOk;
  }, [mood, energy, stress, sleepHours, sleepQuality, focus, fatigue, socialCount, socialSatisfaction, activityTypes, needsIntensity, workoutIntensity]);

  const submit = async () => {
    setSaving(true); setError(null);
    try {
      const payload: CheckinPayload = {
        diaryDate: defaultDate,
        mood_1to10: mood,
        energy_1to10: energy,
        stress_1to10: stress,
        sleep_hours_1to9p: sleepHours,
        sleep_quality_1to10: sleepQuality,
        activity_types: activityTypes as any,
        workout_intensity_1to10: needsIntensity ? workoutIntensity : 0,
        focus_1to10: focus,
        fatigue_1to10: fatigue,
        social_count_1to10: socialCount,
        social_satisfaction_1to10: socialSatisfaction,
      };
      if (mode === 'baseline') {
        onSaved({ percent: 100, values: payload });
      } else {
        const res = await checkinApi.create(payload);
        onSaved({ percent: res.percent, values: payload });
      }
    } catch (e: any) {
      setError(e?.message || '저장에 실패했습니다.');
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <div className="text-lg font-semibold mb-2">하루의 온도</div>
      <div className="space-y-2">
        <Slider label="🙂 기분" value={mood} setValue={setMood} />
        <Slider label="🔋 에너지" value={energy} setValue={setEnergy} />
        <Slider label="😡 스트레스" value={stress} setValue={setStress} />
        <div>
          <div className="text-sm mb-1">😴 수면 시간</div>
          <select value={sleepHours} onChange={(e) => setSleepHours(parseInt(e.target.value))} className="w-full border rounded p-2 text-sm">
            {hoursList.map((h) => (
              <option key={h} value={h}>{h === 9 ? '9+' : h}</option>
            ))}
          </select>
        </div>
        <Slider label="🛌 수면의 질" value={sleepQuality} setValue={setSleepQuality} />
        <div>
          <div className="text-sm mb-1">🏃‍♂️ 활동 종류</div>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_ACTIVITY_TYPES.map((t) => (
              <button key={t} type="button" className={`px-3 py-1 rounded-full text-xs border ${activityTypes.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`} onClick={() => setActivityTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}>{t}</button>
            ))}
          </div>
        </div>
        {needsIntensity && (
          <Slider label="🏋️‍♂️ 강도" value={workoutIntensity} setValue={setWorkoutIntensity} />
        )}
        <Slider label="🧐 집중력" value={focus} setValue={setFocus} />
        <Slider label="🫩 피로도" value={fatigue} setValue={setFatigue} />
        <Slider label="👫 만남 빈도" value={socialCount} setValue={setSocialCount} />
        <Slider label="👩‍❤️‍👨 대화 만족도" value={socialSatisfaction} setValue={setSocialSatisfaction} />
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg">뒤로가기</button>
        <button disabled={!canSubmit || saving} onClick={submit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50">{saving ? '저장 중...' : (mode === 'baseline' ? '베이스라인 저장' : '설문 저장')}</button>
      </div>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
}
