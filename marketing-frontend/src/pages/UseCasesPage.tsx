import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  Users,
  Globe,
  TrendingUp,
  Clock,
  Shield,
  CheckCircle,
  BarChart3,
  DollarSign,
  FileText,
  MapPin,
} from 'lucide-react';

const UseCasesPage: React.FC = () => {
  const useCases = [
    {
      id: 'freight-brokers',
      icon: Users,
      title: 'Freight Brokers',
      subtitle: 'Scale your brokerage with confidence',
      description:
        'Managing hundreds of carriers and thousands of loads requires powerful tools. Our TMS helps brokers maintain visibility, automate workflows, and maximize margins.',
      image: '/images/broker-dashboard.jpg',
      stats: [
        { value: '35%', label: 'Faster Load Booking' },
        { value: '50%', label: 'Less Admin Time' },
        { value: '20%', label: 'Margin Improvement' },
      ],
      challenges: [
        'Managing relationships with hundreds of carriers',
        'Keeping track of shipments across multiple customers',
        'Manual rate negotiations and confirmation',
        'Compliance document tracking',
      ],
      solutions: [
        {
          title: 'Carrier Management Hub',
          description:
            'Centralize all carrier information, performance metrics, and communication in one place.',
        },
        {
          title: 'Automated Rate Confirmation',
          description:
            'Generate and send rate confirmations automatically. Track acceptance and get alerts.',
        },
        {
          title: 'Real-Time Visibility Dashboard',
          description:
            'Monitor all active shipments with live GPS tracking and automated status updates.',
        },
        {
          title: 'Compliance Automation',
          description:
            'Automatic carrier vetting, insurance verification, and document management.',
        },
      ],
    },
    {
      id: 'fleet-owners',
      icon: Truck,
      title: 'Fleet Owners',
      subtitle: 'Maximize your fleet utilization',
      description:
        'Keep your trucks moving and your drivers productive. Our TMS provides complete fleet visibility with tools to optimize routes, manage maintenance, and track performance.',
      image: '/images/fleet-tracking.jpg',
      stats: [
        { value: '25%', label: 'Better Utilization' },
        { value: '15%', label: 'Fuel Savings' },
        { value: '40%', label: 'Faster Dispatch' },
      ],
      challenges: [
        'Knowing where all your trucks are at any time',
        'Optimizing routes to reduce fuel costs',
        'Managing driver hours and compliance',
        'Scheduling preventive maintenance',
      ],
      solutions: [
        {
          title: 'Live Fleet Tracking',
          description:
            'Real-time GPS tracking for every vehicle with geofencing and automated alerts.',
        },
        {
          title: 'Route Optimization',
          description:
            'AI-powered routing that considers traffic, fuel costs, and delivery windows.',
        },
        {
          title: 'Driver Mobile App',
          description:
            'Keep drivers connected with navigation, document capture, and messaging.',
        },
        {
          title: 'Maintenance Scheduler',
          description:
            'Automated maintenance reminders based on mileage, hours, or calendar schedules.',
        },
      ],
    },
    {
      id: 'dispatchers',
      icon: Globe,
      title: 'Independent Dispatchers',
      subtitle: 'Grow your dispatch business',
      description:
        'Whether you dispatch for one carrier or many, our TMS gives you the tools to manage operations efficiently and scale your business.',
      image: '/images/dispatch-center.jpg',
      stats: [
        { value: '60%', label: 'More Loads Managed' },
        { value: '75%', label: 'Faster Response Time' },
        { value: '30%', label: 'Revenue Growth' },
      ],
      challenges: [
        'Managing multiple carriers and owner-operators',
        'Tracking loads across different customers',
        'Manual invoicing and payment collection',
        'Limited visibility into profitability',
      ],
      solutions: [
        {
          title: 'Multi-Carrier Dashboard',
          description:
            'Manage all your carriers from one screen with individual performance tracking.',
        },
        {
          title: 'Automated Invoicing',
          description:
            'Generate invoices automatically when loads are delivered. Track payments easily.',
        },
        {
          title: 'Load Profitability Analysis',
          description:
            'See exactly how much you make on each load with detailed cost breakdowns.',
        },
        {
          title: 'Customer Portal',
          description:
            'Give your customers self-service access to track their shipments and book loads.',
        },
      ],
    },
  ];

  return (
    <div className="bg-dark pt-20">
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Real Solutions for{' '}
              <span className="text-gradient-primary">Real Challenges</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10">
              See how logistics professionals like you are using our TMS to
              transform their operations and grow their businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      {useCases.map((useCase, index) => (
        <section
          key={useCase.id}
          id={useCase.id}
          className={`section ${index % 2 === 0 ? 'bg-dark-50' : ''}`}
        >
          <div className="container-custom">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <useCase.icon className="w-7 h-7 text-primary-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {useCase.title}
                </h2>
                <p className="text-zinc-400">{useCase.subtitle}</p>
              </div>
            </div>

            <p className="text-lg text-zinc-300 max-w-3xl mb-12">
              {useCase.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-16">
              {useCase.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="text-center p-6 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary-500 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Challenges */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-red-400" />
                  </span>
                  Common Challenges
                </h3>
                <ul className="space-y-4">
                  {useCase.challenges.map((challenge, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-red-500/5 rounded-lg border border-red-500/10"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
                      <span className="text-zinc-300">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </span>
                  How We Help
                </h3>
                <ul className="space-y-4">
                  {useCase.solutions.map((solution, idx) => (
                    <li
                      key={idx}
                      className="p-4 bg-green-500/5 rounded-lg border border-green-500/10"
                    >
                      <h4 className="font-semibold text-white mb-1">
                        {solution.title}
                      </h4>
                      <p className="text-sm text-zinc-400">
                        {solution.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Results Section */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Results That Matter
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our customers see measurable improvements across their operations
              within the first 90 days.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingUp,
                value: '40%',
                label: 'Increase in Productivity',
                description:
                  'Less time on admin tasks, more time growing your business.',
              },
              {
                icon: DollarSign,
                value: '25%',
                label: 'Cost Reduction',
                description:
                  'Lower operational costs through automation and optimization.',
              },
              {
                icon: BarChart3,
                value: '3x',
                label: 'Faster Invoicing',
                description:
                  'Automated invoicing gets you paid faster than ever.',
              },
              {
                icon: Shield,
                value: '99%',
                label: 'Compliance Rate',
                description:
                  'Stay compliant with automated document tracking.',
              },
            ].map((result, idx) => (
              <div key={idx} className="card text-center">
                <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                  <result.icon className="w-6 h-6 text-primary-500" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {result.value}
                </div>
                <div className="text-sm font-semibold text-zinc-300 mb-2">
                  {result.label}
                </div>
                <p className="text-xs text-zinc-500">{result.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-dark-50">
        <div className="container-custom">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900/50 to-dark-100 border border-primary-600/30 p-12 md:p-16 text-center">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[150px]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Operations?
              </h2>
              <p className="text-zinc-300 max-w-xl mx-auto mb-8">
                See how our TMS can help you achieve similar results. Schedule a
                personalized demo today.
              </p>
              <Link
                to="/contact"
                className="btn-primary inline-flex items-center gap-2"
                data-testid="usecase-demo-btn"
              >
                Schedule a Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UseCasesPage;
