'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, LoadingPage } from '@/components/ui/loading'
import { patientsApi, PatientResponse, PatientUpdateRequest } from '@/routes'
import { ArrowLeft, Save, User, AlertCircle, Mail, Phone, MapPin } from 'lucide-react'

export default function EditPatientPage() {
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [formData, setFormData] = useState<PatientUpdateRequest>({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchPatientData(token)
  }, [patientId, router])

  const fetchPatientData = async (token: string) => {
    try {
      setLoading(true)
      const patientData = await patientsApi.getPatient(patientId, token)
      setPatient(patientData)
      setFormData({
        name: patientData.name || '',
        email: patientData.email || '',
        phone: patientData.phone || '',
        address: patientData.address || '',
      })
    } catch (error) {
      console.error('Failed to fetch patient data:', error)
      setError('Failed to load patient information')
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

      // Updating patient...
      await patientsApi.updatePatient(patientId, formData, token)
      // Patient updated successfully!
      router.push(`/patients/${patientId}?message=Patient updated successfully`)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update patient'
      setError(errorMessage)
      // Error: ${errorMessage}
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return <LoadingPage text="Loading patient information..." />
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Patient</h2>
          <p className="text-gray-600 mb-4">{error || 'Patient not found'}</p>
          <Link href="/patients">
            <Button className="border hover:bg-slate-200 shadow-sm">Back to Patients</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Link href={`/patients/${patientId}`} className="text-gray-500 hover:text-gray-700 mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border rounded-lg flex items-center justify-center shadow-sm">
                <User className="h-4 w-4 text-slate-700" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Patient</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-8 px-6">
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-slate-700" />
              </div>
              Edit Patient Information
            </CardTitle>
            <CardDescription className="text-gray-600">
              Update {patient.name || 'this patient'}'s information
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Full Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter patient's full name"
                  className="border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter patient's email address"
                  className="border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter patient's phone number"
                  className="border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="flex items-center text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  Address
                </label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter patient's address"
                  className="border-gray-200 focus:border-slate-600 focus:ring-slate-600"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Link href={`/patients/${patientId}`} className="flex-1">
                  <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 border hover:bg-slate-200 shadow-sm"
                  disabled={saving || !formData.name}
                >
                  {saving ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Updating Patient...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Patient
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
