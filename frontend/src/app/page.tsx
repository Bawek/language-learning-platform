import Link from 'next/link'
import { Mic, MessageSquare, Video, Zap, Globe, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Mic,
      title: 'Voice Conversations',
      description:
        'Speak naturally with AI tutors. Get instant pronunciation feedback and real-time speech recognition.',
      color: 'bg-violet-100 text-violet-600',
    },
    {
      icon: MessageSquare,
      title: 'Text Chat',
      description:
        'Practice writing and reading with in-depth grammar corrections and vocabulary suggestions.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Video,
      title: 'Video Immersion',
      description:
        'Experience lifelike conversations with animated AI tutors for maximum immersion.',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description:
        'Receive grammar corrections and suggestions after every message, not just at the end.',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      icon: Globe,
      title: '10+ Languages',
      description:
        'Learn Spanish, French, German, Japanese, Mandarin, and more with native-level AI tutors.',
      color: 'bg-pink-100 text-pink-600',
    },
    {
      icon: TrendingUp,
      title: 'Adaptive Difficulty',
      description:
        'AI agents automatically adjust complexity to your proficiency level from A1 to C2.',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ]

  const languages = ['Spanish', 'French', 'German', 'Japanese', 'Mandarin', 'Portuguese', 'Italian', 'Korean']

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">LinguaAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Powered by GPT-4o
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Master Any Language{' '}
            <span className="text-indigo-600">with AI</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice real conversations with AI tutors that give instant feedback on grammar,
            vocabulary, and pronunciation. Available 24/7 in your target language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-indigo-200"
            >
              Start learning for free
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">No credit card required · Free to start</p>
        </div>
      </section>

      {/* Language Pills */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm text-gray-400 mb-4 uppercase tracking-wider font-medium">
            Supported languages
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to become fluent
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              LinguaAI combines cutting-edge AI with proven language learning techniques
              to help you reach fluency faster.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to start your language journey?
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            Join thousands of learners practicing real conversations with AI tutors today.
          </p>
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors inline-block shadow-lg shadow-indigo-200"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="text-gray-600 text-sm">LinguaAI</span>
          </div>
          <p className="text-gray-400 text-sm">© 2025 LinguaAI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
