'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { patientsApi, PatientResponse } from '@/routes'
import { sessionsApi, SessionResponse } from '@/routes'
import { ArrowLeft, Edit, Calendar, User, FileText, Plus, Eye, Mail, Phone, MapPin, Activity, Clock, Users } from 'lucide-react'
import { AlertCircle } from 'lucide-react'

export default function PatientDetailPage() {
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [visits, setVisits] = useState<SessionResponse[]>([])
  const [loading, setLoading] = useState(true)
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
      const [patientData, visitsData] = await Promise.all([
        patientsApi.getPatient(patientId, token),
        patientsApi.getPatientVisits(patientId, token, 1, 50)
      ])
      setPatient(patientData)
      setVisits(visitsData.sessions)
    } catch (error) {
      console.error('Failed to fetch patient data:', error)
      setError('Failed to load patient information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient information...</p>
        </div>
      </div>
    )
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
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/patients" className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border rounded-lg flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-slate-700" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">{patient.name || 'Unnamed Patient'}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/patients/${patientId}/edit`}>
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Patient
                </Button>
              </Link>
              <Link href={`/sessions/new?patient_id=${patientId}`}>
                <Button className="border hover:bg-slate-200 shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Visit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-slate-700" />
                  </div>
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <User className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="text-gray-900 font-medium">{patient.name || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="text-gray-900">{patient.email || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="text-gray-900">{patient.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="text-gray-900">{patient.address || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <Activity className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Visits</p>
                      <p className="text-gray-900 font-medium">{patient.total_visits}</p>
                    </div>
                  </div>

                  {patient.last_visit && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm text-gray-600">Last Visit</p>
                        <p className="text-gray-900">{new Date(patient.last_visit).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <Clock className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm text-gray-600">Patient Since</p>
                      <p className="text-gray-900">{new Date(patient.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <Activity className="h-5 w-5 text-emerald-700" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Link href={`/sessions/new?patient_id=${patientId}`}>
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Visit
                  </Button>
                </Link>
                <Link href={`/documents/upload?session_id=${visits[0]?.session_id || ''}`}>
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </Link>
                <Link href={`/soap/generate?patient_id=${patientId}`}>
                  <Button variant="outline" className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate SOAP Note
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Visit History */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
                  <span className="flex items-center">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mr-3">
                      <Calendar className="h-5 w-5 text-violet-700" />
                    </div>
                    Visit History
                  </span>
                  <Link href={`/sessions/new?patient_id=${patientId}`}>
                    <Button size="sm" className="border hover:bg-slate-200 shadow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Visit
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {visits.length} visit{visits.length !== 1 ? 's' : ''} recorded
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {visits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border border-slate-200">
                      <Calendar className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No visits recorded</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">This patient hasn't had any visits yet. Schedule their first appointment to begin their care journey.</p>
                    <Link href={`/sessions/new?patient_id=${patientId}`}>
                      <Button className="border hover:bg-slate-200 shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule First Visit
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visits.map((visit) => (
                      <div key={visit.session_id} className="border border-gray-200 rounded-xl p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">
                              Visit on {new Date(visit.visit_date).toLocaleDateString()}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Session {visit.session_id.slice(0, 8)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/sessions/${visit.session_id}`}>
                              <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/sessions/${visit.session_id}/edit`}>
                              <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {visit.notes && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {visit.notes.length > 150 ? `${visit.notes.substring(0, 150)}...` : visit.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex gap-4">
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {visit.document_count} document{visit.document_count !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {visit.soap_note_count} SOAP note{visit.soap_note_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(visit.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
