"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { documentsApi, DocumentUploadRequest } from "@/routes/documents";
import { ArrowLeft, Upload as UploadIcon } from "lucide-react";

export default function DocumentUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSessionId = (searchParams.get("session_id") || "") as string;

  const [sessionId, setSessionId] = useState<string>(defaultSessionId);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [extractText, setExtractText] = useState(true);
  const [generateSOAP, setGenerateSOAP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // keep session id in sync with query param
    setSessionId(defaultSessionId);
  }, [defaultSessionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!sessionId) {
      setError("Please provide a session id");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);

    const payload: DocumentUploadRequest = {
      session_id: sessionId,
      file: file!,
      description,
      upload_source: "web",
      extract_text: extractText,
      generate_soap: generateSOAP,
    };

    try {
      const res = await documentsApi.uploadDocument(payload, token);
      setSuccessMessage(res.message || "Upload successful");
      // optionally redirect back to session page
      setTimeout(() => router.push(`/sessions/${sessionId}`), 900);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err?.message || err?.detail || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Upload Document
                </h1>
                <p className="text-slate-600">
                  Upload and process patient documents
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader className="pb-6 pt-8 px-8">
            <CardTitle className="text-xl font-bold text-slate-900">
              Upload Document
            </CardTitle>
            <CardDescription className="text-slate-600">
              Attach a file to upload for a session
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                  {successMessage}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">
                  Session ID
                </label>
                <Input
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Session ID"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">
                  File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">
                  Description (optional)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={extractText}
                    onChange={(e) => setExtractText(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-slate-700">Extract text (OCR)</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={generateSOAP}
                    onChange={(e) => setGenerateSOAP(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-slate-700">
                    Generate SOAP after upload
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2 inline-block" />{" "}
                      Upload
                    </>
                  )}
                </Button>
                <Link href={`/sessions/${sessionId}`} className="w-36">
                  <Button variant="outline" className="w-full">
                    Back
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </div>
      </main>
    </div>
  );
}
