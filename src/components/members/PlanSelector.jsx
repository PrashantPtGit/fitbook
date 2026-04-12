import clsx from 'clsx'
import { Check } from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'

// Base monthly price used to calculate savings vs paying monthly
const MONTHLY_BASE = 1200

export default function PlanSelector({ plans, selectedPlanId, onSelect }) {
  if (!plans.length) {
    return (
      <p className="text-sm text-gray-400 py-4">
        No plans found for this gym. Check your database.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {plans.map((plan) => {
        const selected = plan.id === selectedPlanId
        const monthsEquiv = plan.duration_days / 30
        const wouldPayMonthly = Math.round(monthsEquiv * MONTHLY_BASE)
        const savings = plan.duration_days > 30 ? Math.max(0, wouldPayMonthly - plan.price) : 0

        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.id)}
            className={clsx(
              'text-left rounded-card border-2 p-4 transition-all focus:outline-none',
              selected
                ? 'border-primary bg-primary-light shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-300'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">{plan.name}</span>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={11} className="text-white" />
                </div>
              )}
            </div>
            <p className={clsx('text-2xl font-bold mb-0.5', selected ? 'text-primary' : 'text-gray-900')}>
              {formatCurrency(plan.price)}
            </p>
            <p className="text-xs text-gray-400">{plan.duration_days} days</p>
            {savings > 0 ? (
              <p className="text-xs text-success font-medium mt-2">
                Save {formatCurrency(savings)}
              </p>
            ) : (
              <p className="text-xs text-gray-300 mt-2">Base price</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
