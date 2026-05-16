import { Shield, Activity, AlertCircle } from 'lucide-react';

interface HomePageProps {
  onNavigateRisk: () => void;
  onNavigateIncident: () => void;
}

export default function HomePage({ onNavigateRisk, onNavigateIncident }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg mb-6">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Incident Management System</h1>
        <p className="text-slate-400 mb-12">Select your dashboard</p>

        <div className="grid gap-6">
          <button
            onClick={onNavigateRisk}
            className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:bg-white/10 transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-600/20 flex items-center justify-center">
                <Activity className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Risk Management</h3>
                <p className="text-slate-400 text-sm">Advanced risk assessment with likelihood & impact analysis</p>
              </div>
            </div>
          </button>

          <button
            onClick={onNavigateIncident}
            className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:bg-white/10 transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Incident Management</h3>
                <p className="text-slate-400 text-sm">Track and resolve incidents efficiently</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}