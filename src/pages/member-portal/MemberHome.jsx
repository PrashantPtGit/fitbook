import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const MemberHome = () => {
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef(null)

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG and PNG photos are accepted.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2MB. Please choose a smaller image.')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handlePhotoSave() {
    if (!photoFile || !member) return
    setPhotoUploading(true)
    try {
      const ext = photoFile.name.split('.').pop()
      const path = `${member.id}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('member-photos')
        .upload(path, photoFile, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('member-photos').getPublicUrl(path)
      const { error: updateErr } = await supabase.from('members').update({ photo_url: publicUrl }).eq('id', member.id)
      if (updateErr) throw updateErr
      setMember((m) => ({ ...m, photo_url: publicUrl }))
      setPhotoFile(null)
      setPhotoPreview(null)
      toast.success('Profile photo saved!')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setPhotoUploading(false)
    }
  }

  function handlePhotoCancel() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (!user || userError) {
          navigate('/login')
          return
        }

        const { data: account, error: accountError } = await supabase
          .from('member_accounts')
          .select('member_id, gym_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!account) {
          if (mounted) {
            setError('No member account linked. Contact your trainer.')
            setLoading(false)
          }
          return
        }

        const { data: memberData } = await supabase
          .from('members')
          .select('*, gyms(name), trainers(name, title, phone)')
          .eq('id', account.member_id)
          .maybeSingle()

        const { data: membershipData } = await supabase
          .from('memberships')
          .select('*, plans(name, price, duration_days)')
          .eq('member_id', account.member_id)
          .eq('status', 'active')
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (mounted) {
          setMember(memberData)
          setMembership(membershipData)
          setLoading(false)
        }

      } catch (err) {
        console.error('Member portal error:', err)
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #E1F5EE', borderTop: '3px solid #1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ fontSize: '14px', color: '#6B6B8A' }}>Loading your profile...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '12px', padding: '20px' }}>
      <p style={{ fontSize: '16px', color: '#A32D2D', textAlign: 'center' }}>{error}</p>
      <button onClick={() => supabase.auth.signOut().then(() => navigate('/login'))} style={{ padding: '10px 20px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Back to login</button>
    </div>
  )

  if (!member) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>No member data found</p>
      <button onClick={() => navigate('/login')}>Go to login</button>
    </div>
  )

  const daysRemaining = membership ? Math.ceil((new Date(membership.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF8', padding: '20px', fontFamily: 'Inter, sans-serif' }}>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Photo upload prompt — shown only when no photo set */}
      {!member.photo_url && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid #E1F5EE', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#085041', marginBottom: '4px' }}>Complete your profile</p>
          <p style={{ fontSize: '12px', color: '#6B6B8A', marginBottom: '16px' }}>Add your photo so your trainer can recognise you!</p>

          {/* Circular avatar / preview */}
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px', borderRadius: '50%', overflow: 'hidden', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
               onClick={() => !photoPreview && fileInputRef.current?.click()}>
            {photoPreview
              ? <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '28px' }}>📷</span>
            }
          </div>

          {!photoPreview ? (
            <button onClick={() => fileInputRef.current?.click()}
              style={{ padding: '10px 24px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Upload Photo
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={handlePhotoCancel}
                style={{ padding: '10px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handlePhotoSave} disabled={photoUploading}
                style={{ padding: '10px 20px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: photoUploading ? 0.6 : 1 }}>
                {photoUploading ? 'Saving…' : 'Save Photo'}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ background: 'linear-gradient(135deg, #1D9E75, #085041)', borderRadius: '16px', padding: '20px', color: 'white', marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Welcome back</p>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{member.name}</h1>
        <p style={{ fontSize: '12px', opacity: 0.8 }}>{member.member_code} · {membership?.plans?.name || 'No active plan'}</p>
        <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>Plan valid until</span>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{membership ? new Date(membership.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: '4px', height: '6px' }}>
            <div style={{ background: 'white', borderRadius: '4px', height: '6px', width: membership ? Math.max(0, Math.min(100, (daysRemaining / (membership.plans?.duration_days || 30)) * 100)) + '%' : '0%' }}></div>
          </div>
          <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{daysRemaining > 0 ? daysRemaining + ' days remaining' : 'Expired'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#6B6B8A', marginBottom: '4px' }}>Member since</p>
          <p style={{ fontSize: '16px', fontWeight: '600' }}>{new Date(member.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#6B6B8A', marginBottom: '4px' }}>Days remaining</p>
          <p style={{ fontSize: '16px', fontWeight: '600', color: daysRemaining < 7 ? '#A32D2D' : daysRemaining < 15 ? '#BA7517' : '#1D9E75' }}>{daysRemaining}</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '80px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Quick actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={() => navigate('/member-portal/attendance')} style={{ padding: '12px', background: '#E1F5EE', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#085041', cursor: 'pointer' }}>📅 Attendance</button>
          <button onClick={() => navigate('/member-portal/health')} style={{ padding: '12px', background: '#E1F5EE', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#085041', cursor: 'pointer' }}>🏋️ Workout Plan</button>
          <button onClick={() => navigate('/member-portal/payments')} style={{ padding: '12px', background: '#E1F5EE', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#085041', cursor: 'pointer' }}>💳 Payments</button>
          <button onClick={() => navigate('/member-portal/more')} style={{ padding: '12px', background: '#E1F5EE', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#085041', cursor: 'pointer' }}>⋯ More</button>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #EBEBF5', display: 'flex', justifyContent: 'space-around', padding: '8px 0 20px' }}>
        <button onClick={() => navigate('/member-portal')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#1D9E75' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '10px', fontWeight: '600' }}>Home</span>
        </button>
        <button onClick={() => navigate('/member-portal/attendance')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B8A' }}>
          <span style={{ fontSize: '20px' }}>📅</span>
          <span style={{ fontSize: '10px' }}>Attendance</span>
        </button>
        <button onClick={() => navigate('/member-portal/payments')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B8A' }}>
          <span style={{ fontSize: '20px' }}>💳</span>
          <span style={{ fontSize: '10px' }}>Payments</span>
        </button>
        <button onClick={() => navigate('/member-portal/health')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B8A' }}>
          <span style={{ fontSize: '20px' }}>❤️</span>
          <span style={{ fontSize: '10px' }}>Health</span>
        </button>
        <button onClick={() => navigate('/member-portal/more')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B8A' }}>
          <span style={{ fontSize: '20px' }}>⋯</span>
          <span style={{ fontSize: '10px' }}>More</span>
        </button>
      </div>

    </div>
  )
}

export default MemberHome
