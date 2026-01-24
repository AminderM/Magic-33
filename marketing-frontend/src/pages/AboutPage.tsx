import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Users, Award, Heart, Truck, Globe, Zap, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const values = [
    { icon: Target, title: 'Customer First', description: "Every feature we build starts with understanding our customers' real challenges and needs." },
    { icon: Zap, title: 'Innovation', description: "We continuously push the boundaries of what's possible in logistics technology." },
    { icon: Shield, title: 'Reliability', description: 'Our platform is built for mission-critical operations with 99.9% uptime guaranteed.' },
    { icon: Heart, title: 'Partnership', description: 'We succeed when our customers succeed. Your growth is our growth.' },
  ];

  const milestones = [
    { year: '2020', title: 'Founded', description: 'Started with a vision to transform logistics operations with modern technology.' },
    { year: '2021', title: 'First 100 Customers', description: 'Reached our first milestone of 100 active customers managing over 50,000 loads.' },
    { year: '2022', title: 'Series A Funding', description: 'Raised funding to accelerate product development and expand our team.' },
    { year: '2023', title: 'AI Integration', description: 'Launched AI-powered features including smart routing and predictive analytics.' },
    { year: '2024', title: '500+ Customers', description: 'Crossed 500 customers and 1 million loads managed through our platform.' },
  ];

  const team = [
    { name: 'Michael Chen', role: 'CEO & Co-Founder', bio: 'Former logistics executive with 15+ years in supply chain management.' },
    { name: 'Sarah Johnson', role: 'CTO & Co-Founder', bio: 'Tech veteran with experience building scalable enterprise platforms.' },
    { name: 'David Rodriguez', role: 'VP of Product', bio: 'Product leader focused on creating intuitive user experiences.' },
    { name: 'Emily Watson', role: 'VP of Customer Success', bio: 'Dedicated to helping customers achieve their operational goals.' },
  ];

  return (
    <div className={`pt-20 ${isDark ? 'bg-dark' : 'bg-white'}`}>
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Building the Future of <span className="text-gradient-primary">Logistics</span>
            </h1>
            <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              We're a team of logistics professionals and technology experts on a mission to transform how the freight industry operates.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? 'bg-primary-600/20 border border-primary-600/30' : 'bg-primary-50 border border-primary-200'}`}>
                <Target className="w-4 h-4 text-primary-500" />
                <span className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>Our Mission</span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Empowering Logistics Professionals</h2>
              <p className={`mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                The logistics industry moves the world. Yet too many freight brokers, fleet owners, and dispatchers are held back by outdated technology and manual processes.
              </p>
              <p className={`mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                We founded Integrated Supply Chain Technologies to change that. Our Transportation Management System brings enterprise-grade capabilities to businesses of all sizes, helping them compete and grow in an increasingly competitive market.
              </p>
              <p className={isDark ? 'text-zinc-400' : 'text-gray-600'}>
                Every feature we build is designed with one goal in mind: helping our customers move more freight, more efficiently, with less stress.
              </p>
            </div>
            <div className="relative">
              <div className={`absolute inset-0 rounded-3xl blur-2xl ${isDark ? 'bg-gradient-to-tr from-primary-600/20 to-transparent' : 'bg-gradient-to-tr from-primary-600/10 to-transparent'}`} />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: Truck, value: '1M+', label: 'Loads Managed' },
                  { icon: Users, value: '500+', label: 'Active Customers' },
                  { icon: Globe, value: '48', label: 'States Covered' },
                  { icon: Award, value: '4.9', label: 'Customer Rating' },
                ].map((stat, idx) => (
                  <div key={idx} className={`rounded-2xl p-8 border text-center ${idx % 2 === 1 ? 'mt-8' : ''} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <stat.icon className="w-10 h-10 text-primary-500 mx-auto mb-4" />
                    <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                    <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`section ${isDark ? '' : 'bg-white'}`}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Values</h2>
            <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>These principles guide everything we do, from product development to customer support.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="card text-center hover:border-primary-600/50 transition-all">
                <div className="w-14 h-14 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value.title}</h3>
                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Journey</h2>
            <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>From a small startup to a trusted partner for hundreds of logistics companies.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className={`absolute left-8 top-0 bottom-0 w-px ${isDark ? 'bg-white/10' : 'bg-gray-300'}`} />
              {/* Milestones */}
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative pl-20">
                    {/* Year Dot */}
                    <div className="absolute left-0 w-16 text-right pr-4">
                      <span className="text-sm font-bold text-primary-500">{milestone.year}</span>
                    </div>
                    {/* Dot */}
                    <div className={`absolute left-[29px] w-3 h-3 rounded-full bg-primary-600 border-4 ${isDark ? 'border-dark-50' : 'border-gray-50'}`} />
                    {/* Content */}
                    <div className="card">
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{milestone.title}</h3>
                      <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`section ${isDark ? '' : 'bg-white'}`}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Leadership Team</h2>
            <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>A team of industry veterans and technology experts driving innovation in logistics.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center group">
                <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center border group-hover:border-primary-600/50 transition-colors ${isDark ? 'bg-gradient-to-br from-primary-600/30 to-primary-600/10 border-white/10' : 'bg-gradient-to-br from-primary-100 to-primary-50 border-gray-200'}`}>
                  <Users className={`w-12 h-12 group-hover:text-primary-500 transition-colors ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                <p className="text-sm text-primary-500 mb-3">{member.role}</p>
                <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="text-center">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Join Our Journey</h2>
            <p className={`max-w-xl mx-auto mb-8 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Whether you're looking to transform your logistics operations or join our team, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn-primary inline-flex items-center gap-2" data-testid="about-demo-btn">Request a Demo <ArrowRight className="w-5 h-5" /></Link>
              <a href="mailto:careers@integratedsct.com" className="btn-secondary">View Careers</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
