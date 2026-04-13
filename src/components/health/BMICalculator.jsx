import { useState } from 'react'
import { calculateBMI } from '../../utils/helpers'

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary (desk job, no exercise)' },
  { value: 'light',       label: 'Light (1–3 days/week)' },
  { value: 'moderate',    label: 'Moderate (3–5 days/week)' },
  { value: 'active',      label: 'Active (6–7 days/week)' },
  { value: 'very_active', label: 'Very active (2× daily or physical job)' },
]

function GaugeBar({ bmi }) {
  // Clamp position: BMI 10–40 range mapped to 0–100%
  const pct = Math.min(Math.max(((bmi - 10) / 30) * 100, 0), 100)
  return (
    <div className="mt-3">
      <div className="relative h-3 rounded-full overflow-hidden flex">
        <div className="flex-1 bg-blue-300" title="Underweight" />
        <div className="flex-1 bg-success" title="Normal" />
        <div className="flex-1 bg-warning" title="Overweight" />
        <div className="flex-1 bg-orange-400" title="Obese I" />
        <div className="flex-1 bg-danger" title="Obese II" />
        {/* needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-800 rounded-full shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex text-[9px] text-gray-400 mt-1 justify-between">
        <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese I</span><span>Obese II</span>
      </div>
    </div>
  )
}

export default function BMICalculator() {
  const [form, setForm] = useState({ weight: '', height: '', age: '', gender: 'male', activity: 'moderate' })
  const [result, setResult] = useState(null)

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function calculate() {
    const r = calculateBMI(
      parseFloat(form.weight),
      parseFloat(form.height),
      parseInt(form.age) || 25,
      form.gender,
      form.activity,
    )
    setResult(r)
  }

  const ready = form.weight && form.height

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label">Weight (kg)</label>
          <input type="number" min="20" max="300" value={form.weight} onChange={(e) => set('weight', e.target.value)} className="input" placeholder="e.g. 75" />
        </div>
        <div className="form-group">
          <label className="label">Height (cm)</label>
          <input type="number" min="100" max="250" value={form.height} onChange={(e) => set('height', e.target.value)} className="input" placeholder="e.g. 170" />
        </div>
        <div className="form-group">
          <label className="label">Age</label>
          <input type="number" min="10" max="100" value={form.age} onChange={(e) => set('age', e.target.value)} className="input" placeholder="e.g. 28" />
        </div>
        <div className="form-group">
          <label className="label">Gender</label>
          <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className="input">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="label">Activity level</label>
        <select value={form.activity} onChange={(e) => set('activity', e.target.value)} className="input">
          {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <button onClick={calculate} disabled={!ready} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
        Calculate BMI & Nutrition
      </button>

      {/* Results */}
      {result && (
        <div className="mt-2 space-y-4">
          {/* BMI hero */}
          <div className="bg-gray-50 rounded-card p-4">
            <div className="flex items-end gap-3">
              <p className={`text-4xl font-bold ${result.color}`}>{result.bmi}</p>
              <div className="mb-1">
                <p className={`text-sm font-semibold ${result.color}`}>{result.category}</p>
                <p className="text-xs text-gray-400">BMI (Indian scale)</p>
              </div>
            </div>
            <GaugeBar bmi={result.bmi} />
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Ideal weight" value={`${result.idealWeightMin}–${result.idealWeightMax} kg`} />
            <Metric label="BMR" value={`${result.bmr} kcal`} sub="at rest" />
            <Metric label="Daily calories" value={`${result.tdee} kcal`} sub="your TDEE" />
            <Metric label="Protein" value={`${result.protein} g/day`} sub="1.6g per kg" />
          </div>

          <div className="bg-blue-50 rounded-btn px-4 py-3">
            <p className="text-xs font-medium text-blue-800">Daily water intake</p>
            <p className="text-lg font-bold text-blue-700">{result.water} L</p>
            <p className="text-[10px] text-blue-500 mt-0.5">Based on body weight (35 ml/kg)</p>
          </div>

          {/* Note */}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Indian BMI thresholds: Normal &lt;23, Overweight 23–25, Obese Class I 25–30, Obese Class II 30+.
            Values are estimates. Consult a healthcare professional for medical advice.
          </p>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, sub }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
