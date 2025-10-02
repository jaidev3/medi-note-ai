'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { patientsApi, PatientCreateRequest } from '@/routes'
import { ArrowLeft, UserPlus, Plus } from 'lucide-react'

export default function NewPatientPage() {
  const [formData, setFormData] = useState<PatientCreateRequest>({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      // Creating patient...
      await patientsApi.createPatient(formData, token)
      // Patient created successfully!
      router.push('/patients?message=Patient created successfully')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create patient'
      setError(errorMessage)
      // Error: ${errorMessage}
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/patients" 
                className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">New Patient</h1>
                  <p className="text-slate-600">Create a comprehensive patient record</p>
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
                  Patient Information
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  Enter the patient's details to create their comprehensive record
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 md:col-span-2">
                      <label htmlFor="name" className="text-sm font-semibold text-slate-700">
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
                        className="h-14 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl text-slate-900 placeholder:text-slate-400 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="patient@example.com"
                        className="h-14 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl text-slate-900 placeholder:text-slate-400 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="h-14 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl text-slate-900 placeholder:text-slate-400 text-base"
                      />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <label htmlFor="address" className="text-sm font-semibold text-slate-700">
                        Address
                      </label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter patient's full address"
                        className="h-14 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-2xl text-slate-900 placeholder:text-slate-400 text-base"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8">
                    <Link href="/patients" className="flex-1">
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
                      disabled={loading || !formData.name}
                    >
                      {loading ? (
                        <>
                          <Loading size="sm" className="mr-3" />
                          Creating Patient...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-3" />
                          Create Patient
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
                  See how the patient record will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <div className="space-y-8">
                  {/* Patient Avatar & Basic Info */}
                  <div className="pb-8 border-b border-slate-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                        <span className="text-slate-700 text-xl font-bold">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {formData.name || 'Patient Name'}
                        </h3>
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mt-1">
                          <span>New Patient</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-900 text-lg">
                      Contact Details
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-sm font-medium text-slate-700">Email</span>
                        <span className="text-sm font-semibold text-slate-900 max-w-[140px] truncate">
                          {formData.email || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-sm font-medium text-slate-700">Phone</span>
                        <span className="text-sm font-semibold text-slate-900 max-w-[140px] truncate">
                          {formData.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-sm font-medium text-slate-700">Address</span>
                        <span className="text-sm font-semibold text-slate-900 max-w-[140px] truncate">
                          {formData.address || 'Not provided'}
                        </span>
                      </div>
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
