'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, LoadingPage } from '@/components/ui/loading'
import { sessionsApi, SessionResponse, SessionUpdateRequest } from '@/routes'
import { patientsApi, PatientResponse } from '@/routes'
import { ArrowLeft, Save, Calendar, User, AlertCircle } from 'lucide-react'

export default function EditSessionPage() {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [formData, setFormData] = useState<SessionUpdateRequest>({
    visit_date: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchSessionData(token)
  }, [sessionId, router])

  const fetchSessionData = async (token: string) => {
    try {
      setLoading(true)
      const sessionData = await sessionsApi.getSession(sessionId, token)
      setSession(sessionData)
      
      setFormData({
        visit_date: sessionData.visit_date.split('T')[0],
        notes: sessionData.notes || '',
      })
      
      // Fetch patient data if session has patient_id
      if (sessionData.patient_id) {
        try {
          const patientData = await patientsApi.getPatient(sessionData.patient_id, token)
          setPatient(patientData)
        } catch (error) {
          console.error('Failed to fetch patient data:', error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch session data:', error)
      setError('Failed to load session information')
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

      // Updating session...
      await sessionsApi.updateSession(sessionId, formData, token)
      // Session updated successfully!
      router.push(`/sessions/${sessionId}?message=Session updated successfully`)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update session'
      setError(errorMessage)
      // Error: ${errorMessage}
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return <LoadingPage text="Loading session information..." />
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Session</h2>
          <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
          <Link href="/sessions">
            <Button>Back to Sessions</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={`/sessions/${sessionId}`} className="text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Edit Session Information
            </CardTitle>
            <CardDescription>
              Update session details for {patient?.name || 'this patient'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient
                </label>
                <Input
                  value={patient?.name || 'Unknown Patient'}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Patient cannot be changed</p>
              </div>

              <div>
                <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Date *
                </label>
                <Input
                  id="visit_date"
                  name="visit_date"
                  type="date"
                  required
                  value={formData.visit_date}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter session notes..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Link href={`/sessions/${sessionId}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saving || !formData.visit_date}
                >
                  {saving ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Updating Session...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Session
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
