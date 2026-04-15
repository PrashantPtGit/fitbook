import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const locations = ['MLC Mall', 'New Shimla', 'Location 3']

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 page-enter">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-card bg-primary-light mb-3">
            <span className="text-primary-dark font-bold text-xl">F</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">FitBook</h1>
          <p className="text-sm text-gray-400 mt-1">Manage all your gyms in one place</p>
        </div>

        {/* Form */}
        <div className="card shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="owner@example.com"
                className={`input ${errors.email ? 'border-danger' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-danger mt-0.5">{errors.email.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'border-danger' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-danger mt-0.5">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center mt-1">
              Sign in
            </Button>
          </form>
        </div>

        {/* Location pills */}
        <div className="mt-6 flex items-center gap-2 justify-center flex-wrap">
          {locations.map((loc, i) => (
            <span
              key={loc}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                i === 0
                  ? 'bg-gym1-light text-gym1-dark'
                  : i === 1
                  ? 'bg-gym2-light text-gym2-dark'
                  : 'bg-gym3-light text-gym3-dark'
              }`}
            >
              {loc}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">3 gym locations · 1 dashboard</p>
      </div>
    </div>
  )
}
