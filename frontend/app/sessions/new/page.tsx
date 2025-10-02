'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, LoadingPage } from '@/components/ui/loading'
import { sessionsApi, SessionCreateRequest } from '@/routes'
import { patientsApi, PatientResponse } from '@/routes'
import { authApi, UserProfile } from '@/routes'
import { ArrowLeft, Save, Calendar, Plus } from 'lucide-react'

export default function NewSessionPage() {
  const [formData, setFormData] = useState<SessionCreateRequest>({
    patient_id: '',
    professional_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchInitialData(token)
  }, [router])

  const fetchInitialData = async (token: string) => {
    try {
      const [patientsData, userData] = await Promise.all([
        patientsApi.listPatients(token, 1, 100),
        authApi.getCurrentUser(token)
      ])
      setPatients(patientsData.patients)
      setCurrentUser(userData)
      
      // Automatically set the professional_id to the current user's ID
      setFormData(prev => ({
        ...prev,
        professional_id: userData.id
      }))
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      setError('Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      // Ensure professional_id is set
      const sessionData = {
        ...formData,
        professional_id: currentUser?.id || formData.professional_id
      }

      // Creating session...
      await sessionsApi.createSession(sessionData, token)
      // Session created successfully!
      router.push('/sessions?message=Session created successfully')
    } catch (err: any) {
      console.error('Session creation error:', err)
      // Better error handling for validation errors
      if (err.status === 422) {
        if (err.message && typeof err.message === 'object') {
          // Handle validation error details
          const validationErrors = err.message.detail || []
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((error: any) => 
              `${error.loc?.join('.')}: ${error.msg}`
            ).join(', ')
            const errorMsg = `Validation error: ${errorMessages}`
            setError(errorMsg)
            // Error: ${errorMsg}
          } else {
            const errorMsg = 'Validation error occurred'
            setError(errorMsg)
            // Error: ${errorMsg}
          }
        } else {
          const errorMsg = 'Validation error occurred'
          setError(errorMsg)
                      // Error: ${errorMsg}
        }
      } else {
        const errorMessage = err.message || 'Failed to create session'
        setError(errorMessage)
                  // Error: ${errorMessage}
      }
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return <LoadingPage text="Loading..." />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/sessions" 
                className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">New Session</h1>
                  <p className="text-slate-600">Schedule a new patient visit session</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* Left Column - Input Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-8 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Session Information
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  Schedule a new patient visit session
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label htmlFor="patient_id" className="text-sm font-semibold text-slate-700">
                        Patient *
                      </label>
                      <select
                        id="patient_id"
                        name="patient_id"
                        required
                        value={formData.patient_id}
                        onChange={handleInputChange}
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                      >
                        <option value="">Select a patient</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.name || 'Unnamed Patient'} - {patient.email || 'No email'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="visit_date" className="text-sm font-semibold text-slate-700">
                        Visit Date *
                      </label>
                      <Input
                        id="visit_date"
                        name="visit_date"
                        type="date"
                        required
                        value={formData.visit_date}
                        onChange={handleInputChange}
                        className="h-14 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl text-slate-900 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="notes" className="text-sm font-semibold text-slate-700">
                        Session Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={4}
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Enter any initial notes about this session..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Hidden field for professional_id */}
                  <input type="hidden" name="professional_id" value={currentUser?.id || ''} />

                  <div className="flex gap-4 pt-8">
                    <Link href="/sessions" className="flex-1">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full h-14 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-2xl text-base font-medium"
                      >
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      className="flex-1 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-base font-semibold"
                      disabled={saving || !formData.patient_id || !formData.visit_date || !currentUser?.id}
                    >
                      {saving ? (
                        <>
                          <Loading size="sm" className="mr-3" />
                          Creating Session...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-3" />
                          Create Session
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </div>
          </div>

          {/* Right Column - Preview Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-32">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-xl font-bold text-slate-900">
                  Preview
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Here's how your session will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <div className="space-y-8">
                  {/* Session Header */}
                  <div className="pb-8 border-b border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                        <Calendar className="h-8 w-8 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          New Session
                        </h3>
                        
                      </div>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-900 text-lg">
                      Session Details
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-sm font-medium text-slate-700">Patient</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {patients.find(p => p.id === formData.patient_id)?.name || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-sm font-medium text-slate-700">Visit Date</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formData.visit_date ? new Date(formData.visit_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-sm font-medium text-slate-700">Professional</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {currentUser?.name || 'Current user'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes Preview */}
                  {formData.notes && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-900 text-lg">
                        Session Notes
                      </h4>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-sm text-slate-700">{formData.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <span className="text-sm font-semibold text-slate-700">Status</span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 text-sm font-bold rounded-full">
                        Scheduled
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
