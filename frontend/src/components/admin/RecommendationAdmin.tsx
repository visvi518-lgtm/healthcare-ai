import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dumbbell, Salad, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  Pencil, X, Check, Database,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import toast from 'react-hot-toast';
import type { ExerciseRoutine, DietRecommendation, ExercisePurpose, DietPurpose, RoutineExercise, NutrientGoal } from '@/types';

// ── Label maps ────────────────────────────────────────────────────────────────

const EX_PURPOSE: Record<ExercisePurpose, string> = {
  posture: '자세 교정',
  strength: '근력 향상',
  weight_management: '체중 관리',
};

const DIET_PURPOSE: Record<DietPurpose, string> = {
  loss: '체중 감량',
  gain: '체중 증량',
  maintain: '체중 유지',
  medical: '의료 목적',
};

const DIFFICULTY = { beginner: '초급', intermediate: '중급', advanced: '고급' };

// ── Empty templates ───────────────────────────────────────────────────────────

const EMPTY_EXERCISE_ITEM: RoutineExercise = { name: '', sets: 3, reps: '', rest: '60초', notes: '' };
const EMPTY_NUTRIENT_ITEM: NutrientGoal = { name: '', target: '', unit: '', notes: '' };

// ── Exercise form ─────────────────────────────────────────────────────────────

interface ExerciseFormData {
  purpose: ExercisePurpose;
  name: string;
  description: string;
  difficulty: string;
  sessions_per_week: number;
  exercises: RoutineExercise[];
}

function ExerciseForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<ExerciseFormData>;
  onSave: (data: ExerciseFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ExerciseFormData>({
    purpose: initial?.purpose ?? 'strength',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    difficulty: initial?.difficulty ?? 'beginner',
    sessions_per_week: initial?.sessions_per_week ?? 3,
    exercises: initial?.exercises?.length ? initial.exercises : [{ ...EMPTY_EXERCISE_ITEM }],
  });

  const updateExercise = (i: number, field: keyof RoutineExercise, val: string | number) => {
    setForm((f) => {
      const exs = [...f.exercises];
      exs[i] = { ...exs[i], [field]: val };
      return { ...f, exercises: exs };
    });
  };

  const addExercise = () =>
    setForm((f) => ({ ...f, exercises: [...f.exercises, { ...EMPTY_EXERCISE_ITEM }] }));

  const removeExercise = (i: number) =>
    setForm((f) => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-4">
      {/* Purpose + Difficulty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">운동 목적</label>
          <select
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value as ExercisePurpose })}
            className="input-base text-sm"
          >
            {(Object.entries(EX_PURPOSE) as [ExercisePurpose, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">난이도</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="input-base text-sm"
          >
            {Object.entries(DIFFICULTY).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">루틴 이름</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예) 초보자 전신 근력 루틴"
          className="input-base text-sm"
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="루틴에 대한 설명"
          className="input-base text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Sessions per week */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">주 운동 횟수</label>
        <input
          type="number"
          min={1} max={7}
          value={form.sessions_per_week}
          onChange={(e) => setForm({ ...form, sessions_per_week: Number(e.target.value) })}
          className="input-base text-sm w-24"
        />
      </div>

      {/* Exercise items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">운동 목록</label>
          <button onClick={addExercise} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <Plus className="w-3 h-3" /> 추가
          </button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {form.exercises.map((ex, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-2 space-y-1.5 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, 'name', e.target.value)}
                  placeholder="운동 이름"
                  className="input-base text-xs flex-1"
                />
                <button onClick={() => removeExercise(i)} className="text-red-400 hover:text-red-600 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="text"
                  value={ex.sets}
                  onChange={(e) => updateExercise(i, 'sets', e.target.value)}
                  placeholder="세트 (예: 3)"
                  className="input-base text-xs"
                />
                <input
                  type="text"
                  value={ex.reps}
                  onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                  placeholder="횟수 (예: 10회)"
                  className="input-base text-xs"
                />
                <input
                  type="text"
                  value={ex.rest}
                  onChange={(e) => updateExercise(i, 'rest', e.target.value)}
                  placeholder="휴식 (예: 60초)"
                  className="input-base text-xs"
                />
              </div>
              <input
                type="text"
                value={ex.notes ?? ''}
                onChange={(e) => updateExercise(i, 'notes', e.target.value)}
                placeholder="메모 (선택)"
                className="input-base text-xs w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm">취소</button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
          className="btn-primary flex-1 text-sm"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

// ── Diet form ─────────────────────────────────────────────────────────────────

interface DietFormData {
  purpose: DietPurpose;
  name: string;
  description: string;
  carb_ratio: number;
  protein_ratio: number;
  fat_ratio: number;
  calorie_note: string;
  nutrients: NutrientGoal[];
}

function DietForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<DietFormData>;
  onSave: (data: DietFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<DietFormData>({
    purpose: initial?.purpose ?? 'loss',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    carb_ratio: initial?.carb_ratio ?? 45,
    protein_ratio: initial?.protein_ratio ?? 30,
    fat_ratio: initial?.fat_ratio ?? 25,
    calorie_note: initial?.calorie_note ?? '',
    nutrients: initial?.nutrients?.length ? initial.nutrients : [{ ...EMPTY_NUTRIENT_ITEM }],
  });

  const total = form.carb_ratio + form.protein_ratio + form.fat_ratio;

  const updateNutrient = (i: number, field: keyof NutrientGoal, val: string) => {
    setForm((f) => {
      const ns = [...f.nutrients];
      ns[i] = { ...ns[i], [field]: val };
      return { ...f, nutrients: ns };
    });
  };

  const addNutrient = () =>
    setForm((f) => ({ ...f, nutrients: [...f.nutrients, { ...EMPTY_NUTRIENT_ITEM }] }));

  const removeNutrient = (i: number) =>
    setForm((f) => ({ ...f, nutrients: f.nutrients.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-4">
      {/* Purpose */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">식단 목적</label>
        <select
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value as DietPurpose })}
          className="input-base text-sm"
        >
          {(Object.entries(DIET_PURPOSE) as [DietPurpose, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">식단 이름</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예) 고단백 칼로리 적자 식단"
          className="input-base text-sm"
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="식단에 대한 설명"
          className="input-base text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Macro ratios */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          탄·단·지 비율 (합계: <span className={total !== 100 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>{total}%</span>)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { label: '탄수화물', key: 'carb_ratio' as const },
            { label: '단백질', key: 'protein_ratio' as const },
            { label: '지방', key: 'fat_ratio' as const },
          ]).map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label} (%)</label>
              <input
                type="number" min={0} max={100}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                className="input-base text-sm"
              />
            </div>
          ))}
        </div>
        {/* Preview bar */}
        <div className="mt-2 flex rounded-full overflow-hidden h-3">
          <div style={{ width: `${form.carb_ratio}%` }} className="bg-amber-400 transition-all" />
          <div style={{ width: `${form.protein_ratio}%` }} className="bg-primary-500 transition-all" />
          <div style={{ width: `${form.fat_ratio}%` }} className="bg-rose-400 transition-all" />
        </div>
      </div>

      {/* Calorie note */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">칼로리 안내</label>
        <input
          type="text"
          value={form.calorie_note}
          onChange={(e) => setForm({ ...form, calorie_note: e.target.value })}
          placeholder="예) TDEE 대비 -500kcal"
          className="input-base text-sm"
        />
      </div>

      {/* Nutrients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">영양소 권장 섭취량</label>
          <button onClick={addNutrient} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <Plus className="w-3 h-3" /> 추가
          </button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {form.nutrients.map((n, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-2 space-y-1.5 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={n.name}
                  onChange={(e) => updateNutrient(i, 'name', e.target.value)}
                  placeholder="영양소명 (예: 단백질)"
                  className="input-base text-xs flex-1"
                />
                <button onClick={() => removeNutrient(i)} className="text-red-400 hover:text-red-600 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={n.target}
                  onChange={(e) => updateNutrient(i, 'target', e.target.value)}
                  placeholder="목표량 (예: 체중×2g)"
                  className="input-base text-xs"
                />
                <input
                  type="text"
                  value={n.unit}
                  onChange={(e) => updateNutrient(i, 'unit', e.target.value)}
                  placeholder="단위 (예: g/일)"
                  className="input-base text-xs"
                />
              </div>
              <input
                type="text"
                value={n.notes ?? ''}
                onChange={(e) => updateNutrient(i, 'notes', e.target.value)}
                placeholder="메모 (선택)"
                className="input-base text-xs w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm">취소</button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim() || total !== 100}
          className="btn-primary flex-1 text-sm"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type SubTab = 'exercise' | 'diet';

export default function RecommendationAdmin() {
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<SubTab>('exercise');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ─── Exercise queries & mutations ───
  const { data: exercises = [] } = useQuery<ExerciseRoutine[]>({
    queryKey: ['adminExercise'],
    queryFn: () => adminApi.getAdminExercise().then((r) => r.data),
    enabled: subTab === 'exercise',
  });

  const createExMutation = useMutation({
    mutationFn: (data: object) => adminApi.createExercise(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminExercise'] });
      setCreating(false);
      toast.success('운동 루틴이 추가되었습니다.');
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '추가에 실패했습니다.'),
  });

  const updateExMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => adminApi.updateExercise(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminExercise'] });
      setEditingId(null);
      toast.success('수정되었습니다.');
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '수정에 실패했습니다.'),
  });

  const toggleExMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.toggleExercise(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminExercise'] }),
  });

  const deleteExMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteExercise(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminExercise'] });
      toast.success('삭제되었습니다.');
    },
  });

  // ─── Diet queries & mutations ───
  const { data: diets = [] } = useQuery<DietRecommendation[]>({
    queryKey: ['adminDiet'],
    queryFn: () => adminApi.getAdminDiet().then((r) => r.data),
    enabled: subTab === 'diet',
  });

  const createDietMutation = useMutation({
    mutationFn: (data: object) => adminApi.createDiet(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminDiet'] });
      setCreating(false);
      toast.success('식단 추천이 추가되었습니다.');
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '추가에 실패했습니다.'),
  });

  const updateDietMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => adminApi.updateDiet(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminDiet'] });
      setEditingId(null);
      toast.success('수정되었습니다.');
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '수정에 실패했습니다.'),
  });

  const toggleDietMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.toggleDiet(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminDiet'] }),
  });

  const deleteDietMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteDiet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminDiet'] });
      toast.success('삭제되었습니다.');
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => adminApi.seedRecommendations(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['adminExercise'] });
      qc.invalidateQueries({ queryKey: ['adminDiet'] });
      toast.success(res.data.message);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '실패했습니다.'),
  });

  const handleTabChange = (t: SubTab) => {
    setSubTab(t);
    setCreating(false);
    setEditingId(null);
    setExpandedId(null);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs + Seed button */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          <button
            onClick={() => handleTabChange('exercise')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${subTab === 'exercise' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <Dumbbell className="w-4 h-4" /> 운동 루틴
          </button>
          <button
            onClick={() => handleTabChange('diet')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${subTab === 'diet' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <Salad className="w-4 h-4" /> 식단 추천
          </button>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            <Database className="w-4 h-4" />
            {seedMutation.isPending ? '추가 중...' : '기본 데이터 추가'}
          </button>
          {!creating && (
            <button
              onClick={() => { setCreating(true); setEditingId(null); }}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {subTab === 'exercise' ? '운동 루틴 추가' : '식단 추천 추가'}
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card border border-primary-100">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            {subTab === 'exercise' ? '새 운동 루틴' : '새 식단 추천'}
          </h3>
          {subTab === 'exercise' ? (
            <ExerciseForm
              onSave={(data) => createExMutation.mutate(data)}
              onCancel={() => setCreating(false)}
              saving={createExMutation.isPending}
            />
          ) : (
            <DietForm
              onSave={(data) => createDietMutation.mutate(data)}
              onCancel={() => setCreating(false)}
              saving={createDietMutation.isPending}
            />
          )}
        </div>
      )}

      {/* ─── Exercise list ─── */}
      {subTab === 'exercise' && (
        <div className="space-y-2">
          {exercises.length === 0 && !creating && (
            <div className="card text-center py-10 text-gray-400">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">등록된 운동 루틴이 없습니다.</p>
              <p className="text-xs mt-1 text-gray-300">"기본 데이터 추가"로 샘플을 불러오거나 직접 추가하세요.</p>
            </div>
          )}
          {exercises.map((r) => (
            <div key={r.id} className="card border border-gray-100">
              {editingId === r.id ? (
                <>
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">루틴 수정</h4>
                  <ExerciseForm
                    initial={r}
                    onSave={(data) => updateExMutation.mutate({ id: r.id, data })}
                    onCancel={() => setEditingId(null)}
                    saving={updateExMutation.isPending}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                          {EX_PURPOSE[r.purpose]}
                        </span>
                        {r.difficulty && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {DIFFICULTY[r.difficulty as keyof typeof DIFFICULTY] ?? r.difficulty}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {r.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        주 {r.sessions_per_week}회 · {r.exercises.length}가지 운동
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        {expandedId === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingId(r.id); setCreating(false); setExpandedId(null); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExMutation.mutate({ id: r.id, is_active: !r.is_active })}
                        className={`p-1.5 rounded-lg ${r.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        {r.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteExMutation.mutate(r.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expandedId === r.id && r.exercises.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-400 border-b border-gray-100">
                            <th className="pb-1 pr-3 font-medium">운동명</th>
                            <th className="pb-1 pr-3 font-medium">세트</th>
                            <th className="pb-1 pr-3 font-medium">횟수</th>
                            <th className="pb-1 pr-3 font-medium">휴식</th>
                            <th className="pb-1 font-medium">메모</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {r.exercises.map((ex, i) => (
                            <tr key={i} className="text-gray-600">
                              <td className="py-1.5 pr-3 font-medium text-gray-800">{ex.name}</td>
                              <td className="py-1.5 pr-3">{ex.sets}</td>
                              <td className="py-1.5 pr-3">{ex.reps}</td>
                              <td className="py-1.5 pr-3">{ex.rest}</td>
                              <td className="py-1.5 text-gray-400">{ex.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Diet list ─── */}
      {subTab === 'diet' && (
        <div className="space-y-2">
          {diets.length === 0 && !creating && (
            <div className="card text-center py-10 text-gray-400">
              <Salad className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">등록된 식단 추천이 없습니다.</p>
              <p className="text-xs mt-1 text-gray-300">"기본 데이터 추가"로 샘플을 불러오거나 직접 추가하세요.</p>
            </div>
          )}
          {diets.map((d) => (
            <div key={d.id} className="card border border-gray-100">
              {editingId === d.id ? (
                <>
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">식단 수정</h4>
                  <DietForm
                    initial={d}
                    onSave={(data) => updateDietMutation.mutate({ id: d.id, data })}
                    onCancel={() => setEditingId(null)}
                    saving={updateDietMutation.isPending}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          {DIET_PURPOSE[d.purpose]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {d.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                      {d.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{d.description}</p>
                      )}
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />탄 {d.carb_ratio}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />단 {d.protein_ratio}%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />지 {d.fat_ratio}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        {expandedId === d.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingId(d.id); setCreating(false); setExpandedId(null); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleDietMutation.mutate({ id: d.id, is_active: !d.is_active })}
                        className={`p-1.5 rounded-lg ${d.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        {d.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteDietMutation.mutate(d.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expandedId === d.id && d.nutrients.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                      {d.nutrients.map((n, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <span className="w-24 flex-shrink-0 font-medium text-gray-700">{n.name}</span>
                          <span className="text-primary-700 font-medium">{n.target}</span>
                          {n.unit && <span className="text-gray-400">{n.unit}</span>}
                          {n.notes && <span className="text-gray-400 hidden sm:block">{n.notes}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
