import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'bg-dark' : 'bg-white'}>
      {/* Hero Section */}
      <section className={`relative min-h-screen flex items-center pt-20 overflow-hidden ${isDark ? '' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        {/* Background Effects */}
        <div className={`absolute inset-0 bg-grid-pattern ${isDark ? 'opacity-30' : 'opacity-5'}`} />
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isDark ? 'bg-primary-600/20' : 'bg-primary-600/10'} rounded-full blur-[120px]`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isDark ? 'bg-primary-600/10' : 'bg-primary-600/5'} rounded-full blur-[120px]`} />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-in ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
                Now Available: TMS v2.0 with AI-Powered Routing
              </span>
            </div>

            {/* Main Heading */}
            <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6 animate-in animate-delay-100 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transform Your{' '}
              <span className="text-gradient-primary">Logistics</span>{' '}
              Operations
            </h1>

            {/* Subheading */}
            <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-in animate-delay-200 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Our Transportation Management System helps freight brokers, fleet
              owners, and dispatchers streamline operations, reduce costs, and
              deliver exceptional service.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in animate-delay-300">
              <Link
                to="/contact"
                className="btn-primary inline-flex items-center justify-center gap-2 text-base"
                data-testid="hero-demo-btn"
              >
                Request a Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/product"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-base"
                data-testid="hero-learn-btn"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 animate-in animate-delay-400">
              {[
                { value: '500+', label: 'Companies Trust Us' },
                { value: '1M+', label: 'Loads Managed' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${isDark ? 'border-zinc-600' : 'border-gray-400'}`}>
            <div className={`w-1 h-2 rounded-full ${isDark ? 'bg-zinc-400' : 'bg-gray-400'}`} />
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Built For Your Business
            </h2>
            <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Whether you're managing a fleet, brokering loads, or dispatching
              independently, our TMS adapts to your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Freight Brokers',
                description:
                  'Manage carriers, track shipments, and maximize margins with real-time visibility across your entire operation.',
                features: [
                  'Carrier Management',
                  'Rate Negotiations',
                  'Load Matching',
                ],
              },
              {
                icon: Truck,
                title: 'Fleet Owners',
                description:
                  'Optimize routes, track assets, and keep your drivers productive with comprehensive fleet management tools.',
                features: [
                  'Asset Tracking',
                  'Route Optimization',
                  'Driver Management',
                ],
              },
              {
                icon: Globe,
                title: 'Independent Dispatchers',
                description:
                  'Scale your dispatch business with powerful tools that help you manage multiple carriers efficiently.',
                features: [
                  'Multi-Carrier Support',
                  'Automated Dispatch',
                  'Customer Portal',
                ],
              },
            ].map((card, index) => (
              <div
                key={index}
                className="card group hover:scale-[1.02] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-600/20 flex items-center justify-center mb-6 group-hover:bg-primary-600/30 transition-colors">
                  <card.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {card.title}
                </h3>
                <p className={`mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{card.description}</p>
                <ul className="space-y-2">
                  {card.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`flex items-center gap-2 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}
                    >
                      <CheckCircle className="w-4 h-4 text-primary-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Benefits Section */}
      <section className={`section ${isDark ? '' : 'bg-white'}`}>
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Everything You Need to{' '}
                <span className="text-gradient-primary">Scale</span>
              </h2>
              <p className={`mb-8 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                Our TMS brings together all the tools you need to manage your
                logistics operations efficiently. From load tracking to
                accounting, everything works seamlessly together.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    title: 'Real-Time Tracking',
                    description:
                      'Monitor every shipment with live GPS tracking and automated status updates.',
                  },
                  {
                    icon: Clock,
                    title: 'Automated Dispatch',
                    description:
                      'Assign loads to the right carriers automatically based on your criteria.',
                  },
                  {
                    icon: DollarSign,
                    title: 'Integrated Accounting',
                    description:
                      'Streamline invoicing, payments, and financial reporting in one place.',
                  },
                  {
                    icon: FileText,
                    title: 'Document Management',
                    description:
                      'Store, organize, and access all your shipping documents instantly.',
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <benefit.icon className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {benefit.title}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Preview */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-3xl blur-2xl ${isDark ? 'bg-gradient-to-tr from-primary-600/20 to-transparent' : 'bg-gradient-to-tr from-primary-600/10 to-transparent'}`} />
              <div className={`relative rounded-2xl border overflow-hidden shadow-2xl ${isDark ? 'bg-dark-100 border-white/10' : 'bg-white border-gray-200'}`}>
                <div className={`px-4 py-3 border-b flex items-center gap-2 ${isDark ? 'bg-dark-200 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className={`text-xs ml-2 ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                    TMS Dashboard
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Active Loads', value: '47' },
                      { label: 'In Transit', value: '23' },
                      { label: 'Delivered Today', value: '18' },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-4 text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                      >
                        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stat.value}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        id: 'LD-2847',
                        route: 'Chicago → Dallas',
                        status: 'In Transit',
                        color: 'text-yellow-500',
                      },
                      {
                        id: 'LD-2848',
                        route: 'LA → Phoenix',
                        status: 'Loading',
                        color: 'text-blue-500',
                      },
                      {
                        id: 'LD-2849',
                        route: 'Miami → Atlanta',
                        status: 'Delivered',
                        color: 'text-green-500',
                      },
                    ].map((load, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Truck className={`w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
                          <div>
                            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {load.id}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                              {load.route}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${load.color}`}>
                          {load.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Our TMS?
            </h2>
            <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              We've built our platform with the unique challenges of the
              logistics industry in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                description:
                  'Built for speed. Our platform handles millions of data points without breaking a sweat.',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description:
                  'Bank-grade encryption and compliance with industry standards keep your data safe.',
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description:
                  'Make data-driven decisions with comprehensive reporting and insights.',
              },
              {
                icon: Globe,
                title: 'Scalable Platform',
                description:
                  'From 10 loads to 10,000, our platform grows with your business needs.',
              },
              {
                icon: Users,
                title: '24/7 Support',
                description:
                  'Our dedicated support team is always available to help you succeed.',
              },
              {
                icon: Truck,
                title: 'Industry Expertise',
                description:
                  'Built by logistics professionals who understand your daily challenges.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:border-primary-600/50' : 'bg-white border-gray-200 hover:border-primary-600/50 shadow-sm'}`}
              >
                <feature.icon className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`section ${isDark ? '' : 'bg-white'}`}>
        <div className="container-custom">
          <div className={`relative overflow-hidden rounded-3xl p-12 md:p-16 text-center ${isDark ? 'bg-gradient-to-br from-primary-900/50 to-dark-100 border border-primary-600/30' : 'bg-gradient-to-br from-primary-50 to-white border border-primary-200'}`}>
            <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] ${isDark ? 'bg-primary-600/20' : 'bg-primary-600/10'}`} />

            <div className="relative z-10">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Ready to Transform Your Operations?
              </h2>
              <p className={`max-w-xl mx-auto mb-8 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
                Join hundreds of logistics companies who have already streamlined
                their operations with our TMS.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact"
                  className="btn-primary inline-flex items-center justify-center gap-2 text-base"
                  data-testid="cta-demo-btn"
                >
                  Schedule a Demo
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/product" className="btn-secondary text-base">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
