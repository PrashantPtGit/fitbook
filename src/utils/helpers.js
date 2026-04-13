import { format, parseISO, differenceInDays, subDays } from 'date-fns'

// ─── Currency ────────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Dates ───────────────────────────────────────────────────────────────────
export function formatDate(dateString) {
  if (!dateString) return '—'
  try { return format(parseISO(dateString), 'd MMM yyyy') } catch { return dateString }
}

export function formatDateShort(dateString) {
  if (!dateString) return '—'
  try { return format(parseISO(dateString), 'd MMM') } catch { return dateString }
}

export function daysFromNow(dateString) {
  if (!dateString) return 0
  try { return differenceInDays(parseISO(dateString), new Date()) } catch { return 0 }
}

// ─── Membership Status ───────────────────────────────────────────────────────
export function getMembershipStatus(endDate) {
  const days = daysFromNow(endDate)
  if (days < 0)   return { status: 'expired',  label: 'Expired',             badgeVariant: 'red' }
  if (days === 0) return { status: 'critical', label: 'Expires today',        badgeVariant: 'red' }
  if (days <= 3)  return { status: 'critical', label: `${days} days left`,    badgeVariant: 'red' }
  if (days <= 7)  return { status: 'warning',  label: `${days} days left`,    badgeVariant: 'amber' }
  if (days <= 30) return { status: 'active',   label: `${days} days left`,    badgeVariant: 'green' }
  return              { status: 'active',   label: 'Active',               badgeVariant: 'green' }
}

// ─── Member Code ─────────────────────────────────────────────────────────────
export function generateMemberCode(gymName = '', existingCount = 0) {
  const num = String(existingCount + 1).padStart(3, '0')
  const name = gymName.toLowerCase()
  if (name.includes('mall') || name.includes('mlc mall')) return `MAL-${num}`
  if (name.includes('shimla') || name.includes('new shimla')) return `SHM-${num}`
  if (name.includes('location 3') || name.includes('lc3')) return `LC3-${num}`
  return `MBR-${num}`
}

// ─── BMI (Indian thresholds) ──────────────────────────────────────────────────
const ACTIVITY_MULTIPLIERS = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
}

export function calculateBMI(weightKg, heightCm, age = 25, gender = 'male', activityLevel = 'moderate') {
  if (!weightKg || !heightCm) return null
  const heightM = heightCm / 100
  const bmi     = parseFloat((weightKg / (heightM * heightM)).toFixed(1))

  let category, color, bgColor
  if (bmi < 18.5)      { category = 'Underweight';  color = 'text-blue-500';    bgColor = 'bg-blue-500'    }
  else if (bmi < 23)   { category = 'Normal weight'; color = 'text-success';     bgColor = 'bg-success'     }
  else if (bmi < 25)   { category = 'Overweight';    color = 'text-warning';     bgColor = 'bg-warning'     }
  else if (bmi < 30)   { category = 'Obese Class I'; color = 'text-orange-500';  bgColor = 'bg-orange-500'  }
  else                 { category = 'Obese Class II'; color = 'text-danger';      bgColor = 'bg-danger'      }

  // Ideal weight: BMI 22.5 × height²  ±5 kg
  const idealMid    = parseFloat((22.5 * heightM * heightM).toFixed(1))
  const idealWeightMin = Math.round(idealMid - 5)
  const idealWeightMax = Math.round(idealMid + 5)

  // BMR (Mifflin-St Jeor)
  const bmr = gender === 'female'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55
  const tdee       = Math.round(bmr * multiplier)
  const protein    = Math.round(weightKg * 1.6)
  const water      = (weightKg * 35 / 1000).toFixed(1)

  return { bmi, category, color, bgColor, idealWeightMin, idealWeightMax, bmr: Math.round(bmr), tdee, protein, water }
}

// ─── Initials ────────────────────────────────────────────────────────────────
export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0][0] + (parts[0][1] || parts[0][0])).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Gym Colours ─────────────────────────────────────────────────────────────
export function getGymColor(gymIndex = 0) {
  const colors = [
    { bg: 'bg-primary-light', text: 'text-primary-dark', dot: '#534AB7' },
    { bg: 'bg-success-light', text: 'text-success-dark', dot: '#1D9E75' },
    { bg: 'bg-warning-light', text: 'text-warning-dark', dot: '#BA7517' },
  ]
  return colors[gymIndex % colors.length]
}

// ─── String utils ────────────────────────────────────────────────────────────
export function truncate(str = '', maxLength = 30) {
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────
export function generateWhatsAppLink(phone = '', message = '') {
  const clean = phone.replace(/^\+91/, '').replace(/[\s\-()]/g, '')
  return `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`
}

export function buildRenewalMessage(memberName, gymName, planName, amount, expiryDate) {
  return `Hi ${memberName}! Your ${planName} membership at ${gymName} expires on ${expiryDate}. Renew now for ₹${amount}. Reply to this message or visit the gym. - FitBook`
}

export function buildWelcomeMessage(memberName, gymName, planName, startDate, endDate, batchTiming) {
  return `🏋️ Welcome to ${gymName}, ${memberName}!\n\nYour membership details:\n📋 Plan: ${planName}\n📅 Start: ${startDate}\n📅 Valid till: ${endDate}\n⏰ Batch: ${batchTiming}\n\nWe're excited to have you on your fitness journey! See you at the gym. 💪\n- FitBook`
}

export function buildBirthdayMessage(memberName, gymName) {
  return `🎂 Happy Birthday, ${memberName}!\n\nWishing you a fantastic birthday from all of us at ${gymName}. Keep up the great work on your fitness journey! 💪🎉\n- FitBook Team`
}

export function buildInactiveMessage(memberName, gymName, dayCount = 10) {
  return `Hey ${memberName}! We miss you at ${gymName}. It has been ${dayCount} days since your last visit. Come back strong 💪 Your membership is still active. See you soon! - FitBook`
}

export function buildHolidayMessage(gymName, date, holiday) {
  return `${gymName} will be closed on ${date} for ${holiday}. We will reopen the next day. Thank you for your understanding. - FitBook Team`
}

export function buildOfferMessage(gymName, planName, offerPrice, originalPrice, validTill) {
  return `Special offer at ${gymName}! ${planName} membership at just ₹${offerPrice} (original ₹${originalPrice}). Valid till ${validTill}. Limited spots available. Contact us now! - FitBook`
}

// ─── Date helpers ────────────────────────────────────────────────────────────
export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function dateISO(date) {
  return format(date, 'yyyy-MM-dd')
}

export function subDaysISO(days) {
  return format(subDays(new Date(), days), 'yyyy-MM-dd')
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
export function exportMembersCSV(members) {
  const headers = ['Member ID', 'Name', 'Phone', 'Plan', 'Start Date', 'End Date', 'Status', 'Batch', 'Trainer']
  const rows = members.map((m) => {
    const ms = m.memberships?.[0]
    const st = ms ? getMembershipStatus(ms.end_date) : { status: 'unknown' }
    return [
      m.member_code || '',
      m.name || '',
      m.phone || '',
      ms?.plans?.name || '',
      ms?.start_date || '',
      ms?.end_date || '',
      st.status,
      m.batch_timing || '',
      m.trainers?.name || '',
    ]
  })

  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `fitbook-members-${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportPaymentsCSV(payments, filename) {
  const headers = ['Date', 'Member Name', 'Member ID', 'Plan', 'Amount', 'Mode', 'Transaction ID', 'Note']
  const rows = payments.map((p) => [
    p.payment_date || '',
    p.members?.name || '',
    p.members?.member_code || '',
    p.plans?.name || '',
    p.amount || 0,
    p.payment_mode || '',
    p.transaction_id || '',
    p.note || '',
  ])
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename || `fitbook-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
