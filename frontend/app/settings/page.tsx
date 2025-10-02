'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading, LoadingPage } from '@/components/ui/loading'
import { authApi, usersApi, UserProfile, ProfessionalUpdateRequest } from '@/routes'
import { ArrowLeft, Save, User, Shield, Bell, Palette, LogOut, Mail, Calendar, Clock, Settings, AlertCircle, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<ProfessionalUpdateRequest>({
    name: '',
    phone_number: '',
    department: '',
    employee_id: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserData(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const userData = await authApi.getCurrentUser(token)
      setUser(userData)
      setFormData({
        name: userData.name || '',
        phone_number: userData.phone_number || '',
        department: userData.department || '',
        employee_id: userData.employee_id || '',
      })
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      localStorage.removeItem('access_token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('access_token')
      if (!token || !user) {
        router.push('/login')
        return
      }

      // Updating profile...
      await usersApi.updateProfessional(user.id, formData, token)
      setSuccess('Profile updated successfully')
      // Profile updated successfully!
      
      // Refresh user data
      const updatedUser = await authApi.getCurrentUser(token)
      setUser(updatedUser)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile'
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

  const handleLogout = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        await authApi.logout(token)
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  if (loading) {
    return <LoadingPage text="Loading settings..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                  <p className="text-slate-600">Manage your profile and account preferences</p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="border-slate-200 text-slate-700 hover:bg-slate-50 px-6 h-11 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Left Column - Profile Settings */}
          <div className="xl:col-span-2 space-y-8">
            {/* Profile Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-slate-900">Profile Information</CardTitle>
                <CardDescription className="text-slate-600">
                  Update your professional profile and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="name" className="flex items-center text-sm font-medium text-slate-700">
                        <User className="h-4 w-4 mr-2 text-slate-500" />
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl"
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="phone_number" className="flex items-center text-sm font-medium text-slate-700">
                        <Bell className="h-4 w-4 mr-2 text-slate-500" />
                        Phone Number
                      </label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="department" className="flex items-center text-sm font-medium text-slate-700">
                        <Shield className="h-4 w-4 mr-2 text-slate-500" />
                        Department
                      </label>
                      <Input
                        id="department"
                        name="department"
                        type="text"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="Enter your department"
                        className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl"
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="employee_id" className="flex items-center text-sm font-medium text-slate-700">
                        <User className="h-4 w-4 mr-2 text-slate-500" />
                        Employee ID
                      </label>
                      <Input
                        id="employee_id"
                        name="employee_id"
                        type="text"
                        value={formData.employee_id}
                        onChange={handleInputChange}
                        placeholder="Enter your employee ID"
                        className="h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-sm"
                    >
                      {saving ? (
                        <>
                          <Loading size="sm" className="mr-2" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </div>

            {/* Account Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="text-xl font-bold text-slate-900">Account Information</CardTitle>
                <CardDescription className="text-slate-600">
                  Your account details and role information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <Mail className="h-4 w-4 mr-2 text-slate-500" />
                        Email Address
                      </label>
                      <Input
                        value={user.email}
                        disabled
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                      />
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <Shield className="h-4 w-4 mr-2 text-slate-500" />
                        Professional Role
                      </label>
                      <Input
                        value={user.role}
                        disabled
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                      />
                      <p className="text-xs text-slate-500 mt-1">Role cannot be changed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                        Account Created
                      </label>
                      <Input
                        value={new Date(user.created_at).toLocaleDateString()}
                        disabled
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <Clock className="h-4 w-4 mr-2 text-slate-500" />
                        Last Updated
                      </label>
                      <Input
                        value={new Date(user.updated_at).toLocaleDateString()}
                        disabled
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>

          {/* Right Column - Profile Preview and Actions */}
          <div className="xl:col-span-2 space-y-6">
            {/* Profile Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-6 pt-8 px-6">
                <CardTitle className="text-xl font-bold text-slate-900">Profile Preview</CardTitle>
                <CardDescription className="text-slate-600">
                  Here's how your profile will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="text-center pb-6 border-b border-slate-100">
                    <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm border border-slate-200">
                      <User className="h-10 w-10 text-slate-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {formData.name || user.name || 'Your Name'}
                    </h3>
                    <p className="text-slate-500 text-sm">{formData.department || user.department || 'Department'}</p>
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-slate-600" />
                      Profile Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-600">Employee ID</span>
                        <span className="text-sm font-medium text-slate-900">
                          {formData.employee_id || user.employee_id || 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-600">Phone Number</span>
                        <span className="text-sm font-medium text-slate-900">
                          {formData.phone_number || user.phone_number || 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-600">Email</span>
                        <span className="text-sm font-medium text-slate-900">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Status</span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-3">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full h-10 justify-start border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm">
                      ← Back to Dashboard
                    </Button>
                  </Link>
                  <Link href="/patients">
                    <Button variant="outline" className="w-full h-10 justify-start border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm">
                      Manage Patients
                    </Button>
                  </Link>
                  <Link href="/sessions">
                    <Button variant="outline" className="w-full h-10 justify-start border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm">
                      View Sessions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </div>

            {/* System Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-lg font-bold text-slate-900">System Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-600">Version:</span>
                    <span className="font-medium text-slate-900">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-600">Environment:</span>
                    <span className="font-medium text-slate-900">Production</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-600">Last Login:</span>
                    <span className="font-medium text-slate-900">Today</span>
                  </div>
                </div>
              </CardContent>
            </div>

            {/* Support Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-lg font-bold text-slate-900">Support & Help</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-3 text-sm">
                  <p className="text-slate-600">
                    Need help with the system? Contact your system administrator or refer to the user manual.
                  </p>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
