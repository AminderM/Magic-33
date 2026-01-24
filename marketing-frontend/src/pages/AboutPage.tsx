import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  Users,
  Award,
  Heart,
  Truck,
  Globe,
  Zap,
  Shield,
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Customer First',
      description:
        'Every feature we build starts with understanding our customers\' real challenges and needs.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description:
        'We continuously push the boundaries of what\'s possible in logistics technology.',
    },
    {
      icon: Shield,
      title: 'Reliability',
      description:
        'Our platform is built for mission-critical operations with 99.9% uptime guaranteed.',
    },
    {
      icon: Heart,
      title: 'Partnership',
      description:
        'We succeed when our customers succeed. Your growth is our growth.',
    },
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Founded',
      description:
        'Started with a vision to transform logistics operations with modern technology.',
    },
    {
      year: '2021',
      title: 'First 100 Customers',
      description:
        'Reached our first milestone of 100 active customers managing over 50,000 loads.',
    },
    {
      year: '2022',
      title: 'Series A Funding',
      description:
        'Raised funding to accelerate product development and expand our team.',
    },
    {
      year: '2023',
      title: 'AI Integration',
      description:
        'Launched AI-powered features including smart routing and predictive analytics.',
    },
    {
      year: '2024',
      title: '500+ Customers',
      description:
        'Crossed 500 customers and 1 million loads managed through our platform.',
    },
  ];

  const team = [
    {
      name: 'Michael Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former logistics executive with 15+ years in supply chain management.',
    },
    {
      name: 'Sarah Johnson',
      role: 'CTO & Co-Founder',
      bio: 'Tech veteran with experience building scalable enterprise platforms.',
    },
    {
      name: 'David Rodriguez',
      role: 'VP of Product',
      bio: 'Product leader focused on creating intuitive user experiences.',
    },
    {
      name: 'Emily Watson',
      role: 'VP of Customer Success',
      bio: 'Dedicated to helping customers achieve their operational goals.',
    },
  ];

  return (
    <div className="bg-dark pt-20">
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Building the Future of{' '}
              <span className="text-gradient-primary">Logistics</span>
            </h1>
            <p className="text-lg text-zinc-400">
              We're a team of logistics professionals and technology experts on a
              mission to transform how the freight industry operates.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section bg-dark-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/20 border border-primary-600/30 mb-6">
                <Target className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-primary-400">Our Mission</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Empowering Logistics Professionals
              </h2>

              <p className="text-zinc-400 mb-6">
                The logistics industry moves the world. Yet too many freight
                brokers, fleet owners, and dispatchers are held back by outdated
                technology and manual processes.
              </p>

              <p className="text-zinc-400 mb-6">
                We founded Integrated Supply Chain Technologies to change that.
                Our Transportation Management System brings enterprise-grade
                capabilities to businesses of all sizes, helping them compete and
                grow in an increasingly competitive market.
              </p>

              <p className="text-zinc-400">
                Every feature we build is designed with one goal in mind: helping
                our customers move more freight, more efficiently, with less
                stress.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                  <Truck className="w-10 h-10 text-primary-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-1">1M+</div>
                  <div className="text-sm text-zinc-500">Loads Managed</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center mt-8">
                  <Users className="w-10 h-10 text-primary-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-1">500+</div>
                  <div className="text-sm text-zinc-500">Active Customers</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
                  <Globe className="w-10 h-10 text-primary-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-1">48</div>
                  <div className="text-sm text-zinc-500">States Covered</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center mt-8">
                  <Award className="w-10 h-10 text-primary-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-1">4.9</div>
                  <div className="text-sm text-zinc-500">Customer Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Our Values
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              These principles guide everything we do, from product development to
              customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="card text-center hover:border-primary-600/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-zinc-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section bg-dark-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Our Journey
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              From a small startup to a trusted partner for hundreds of logistics
              companies.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10" />

              {/* Milestones */}
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative pl-20">
                    {/* Year Dot */}
                    <div className="absolute left-0 w-16 text-right pr-4">
                      <span className="text-sm font-bold text-primary-500">
                        {milestone.year}
                      </span>
                    </div>
                    {/* Dot */}
                    <div className="absolute left-[29px] w-3 h-3 rounded-full bg-primary-600 border-4 border-dark-50" />

                    {/* Content */}
                    <div className="card">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-zinc-400">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Leadership Team
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              A team of industry veterans and technology experts driving
              innovation in logistics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-600/30 to-primary-600/10 mx-auto mb-6 flex items-center justify-center border border-white/10 group-hover:border-primary-600/50 transition-colors">
                  <Users className="w-12 h-12 text-zinc-500 group-hover:text-primary-500 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-primary-500 mb-3">{member.role}</p>
                <p className="text-sm text-zinc-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-dark-50">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Join Our Journey
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto mb-8">
              Whether you're looking to transform your logistics operations or
              join our team, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="btn-primary inline-flex items-center gap-2"
                data-testid="about-demo-btn"
              >
                Request a Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="mailto:careers@integratedsct.com"
                className="btn-secondary"
              >
                View Careers
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
