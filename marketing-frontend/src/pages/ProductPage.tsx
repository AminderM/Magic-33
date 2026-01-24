import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Truck,
  Users,
  Globe,
  MapPin,
  FileText,
  BarChart3,
  Clock,
  DollarSign,
  Shield,
  Zap,
  MessageSquare,
  Settings,
  Database,
  Cloud,
} from 'lucide-react';

const ProductPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brokers' | 'fleet' | 'dispatchers'>('brokers');

  const audienceTabs = {
    brokers: {
      title: 'For Freight Brokers',
      description:
        'Streamline your brokerage operations with tools designed to manage carriers, negotiate rates, and maintain visibility across all shipments.',
      features: [
        'Carrier relationship management',
        'Automated rate confirmation',
        'Load board integration',
        'Margin analytics and reporting',
        'Shipper portal for self-service booking',
        'Compliance document management',
      ],
    },
    fleet: {
      title: 'For Fleet Owners',
      description:
        'Take control of your fleet with comprehensive tracking, maintenance scheduling, and driver management all in one platform.',
      features: [
        'Real-time GPS fleet tracking',
        'Driver mobile app with navigation',
        'Maintenance scheduling and alerts',
        'Fuel management integration',
        'Hours of service compliance',
        'Performance analytics by vehicle',
      ],
    },
    dispatchers: {
      title: 'For Independent Dispatchers',
      description:
        'Scale your dispatch business with powerful automation and multi-carrier management capabilities.',
      features: [
        'Multi-carrier dashboard',
        'Automated dispatch assignments',
        'Customer invoicing automation',
        'Load profitability tracking',
        'Communication hub',
        'Custom reporting tools',
      ],
    },
  };

  const features = [
    {
      icon: MapPin,
      title: 'Real-Time Tracking',
      description:
        'Track every shipment in real-time with GPS integration. Get instant updates on location, ETA, and delivery status.',
    },
    {
      icon: Clock,
      title: 'Automated Dispatch',
      description:
        'Smart load assignment based on driver availability, location, and performance. Reduce manual work by 70%.',
    },
    {
      icon: DollarSign,
      title: 'Integrated Accounting',
      description:
        'From invoicing to payments, manage all your finances in one place. QuickBooks and Sage integration included.',
    },
    {
      icon: FileText,
      title: 'Document Management',
      description:
        'Digital BOLs, PODs, and rate confirmations. Automatic document capture and organized storage.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description:
        'Make data-driven decisions with comprehensive KPIs, revenue tracking, and performance metrics.',
    },
    {
      icon: MessageSquare,
      title: 'Communication Hub',
      description:
        'Centralized messaging with drivers, carriers, and shippers. Never miss an important update.',
    },
    {
      icon: Settings,
      title: 'Workflow Automation',
      description:
        'Create custom workflows to automate repetitive tasks. Set triggers and actions that match your process.',
    },
    {
      icon: Shield,
      title: 'Compliance Management',
      description:
        'Stay compliant with FMCSA regulations. Automatic carrier vetting and documentation tracking.',
    },
  ];

  return (
    <div className="bg-dark pt-20">
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/20 border border-primary-600/30 mb-6">
              <Truck className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-primary-400">
                Transportation Management System
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              One Platform,{' '}
              <span className="text-gradient-primary">Complete Control</span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10">
              Our TMS brings together everything you need to manage your
              logistics operations—from dispatch to delivery, billing to
              compliance.
            </p>

            <Link
              to="/contact"
              className="btn-primary inline-flex items-center gap-2"
              data-testid="product-demo-btn"
            >
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section bg-dark-50" id="features">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Every tool you need to manage your logistics operations, designed
              to work seamlessly together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card hover:border-primary-600/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mb-4 group-hover:bg-primary-600/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's Built For - Tabs */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built For Your Role
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Whether you're a broker, fleet owner, or independent dispatcher,
              we've got you covered.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-dark-100 rounded-xl p-1 border border-white/10">
              {[
                { id: 'brokers', label: 'Freight Brokers', icon: Users },
                { id: 'fleet', label: 'Fleet Owners', icon: Truck },
                { id: 'dispatchers', label: 'Dispatchers', icon: Globe },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {audienceTabs[activeTab].title}
              </h3>
              <p className="text-zinc-400 mb-8">
                {audienceTabs[activeTab].description}
              </p>
              <ul className="space-y-4">
                {audienceTabs[activeTab].features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary-500" />
                    </div>
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-dark-100 rounded-2xl border border-white/10 p-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary-500" />
                      </div>
                      <div className="flex-grow">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                      <div className="w-20 h-8 bg-primary-600/20 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="section bg-dark-50" id="integrations">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Seamless Integrations
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Connect with the tools you already use. Our TMS integrates with
              leading accounting, ELD, and load board platforms.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              'QuickBooks',
              'Sage',
              'DAT',
              'Truckstop',
              'Samsara',
              'KeepTruckin',
              'Geotab',
              'MacroPoint',
              'FourKites',
              'project44',
              'Trimble',
              'PeopleNet',
            ].map((integration, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
              >
                <span className="text-sm font-medium text-zinc-400">
                  {integration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section" id="pricing">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              No hidden fees. No surprises. Just powerful tools at a fair price.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="card-highlight text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-primary-600 text-white text-xs font-medium rounded-bl-lg">
                POPULAR
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Professional Plan
                </h3>
                <p className="text-zinc-400">
                  Everything you need to run your logistics business
                </p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold text-white">$299</span>
                <span className="text-zinc-400">/month</span>
              </div>

              <ul className="space-y-4 mb-8 text-left">
                {[
                  'Unlimited loads',
                  'Real-time GPS tracking',
                  'Automated dispatch',
                  'Integrated accounting',
                  'Document management',
                  'Analytics dashboard',
                  'API access',
                  '24/7 support',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary-500" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="btn-primary w-full justify-center"
                data-testid="pricing-cta-btn"
              >
                Start Your Free Trial
              </Link>

              <p className="text-xs text-zinc-500 mt-4">
                14-day free trial. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="section bg-dark-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Enterprise-Grade Infrastructure
              </h2>
              <p className="text-zinc-400 mb-8">
                Built on modern cloud infrastructure to ensure reliability,
                security, and performance at any scale.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Cloud, label: '99.9% Uptime', desc: 'SLA guaranteed' },
                  { icon: Shield, label: 'SOC 2 Type II', desc: 'Certified' },
                  { icon: Database, label: 'Daily Backups', desc: 'Automated' },
                  { icon: Zap, label: '<100ms', desc: 'API response' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{item.label}</div>
                      <div className="text-sm text-zinc-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-primary-600/20 rounded-full blur-3xl" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-dark-100 border border-white/10 flex items-center justify-center">
                      <Shield className="w-12 h-12 text-primary-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto mb-8">
              Join hundreds of logistics companies already using our TMS to
              streamline their operations.
            </p>
            <Link
              to="/contact"
              className="btn-primary inline-flex items-center gap-2"
            >
              Request a Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductPage;
