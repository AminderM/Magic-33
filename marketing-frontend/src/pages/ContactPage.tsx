import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  role: string;
  fleetSize: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    role: '',
    fleetSize: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/marketing/demo-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          role: formData.role,
          fleet_size: formData.fleetSize,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          phone: '',
          role: '',
          fleetSize: '',
          message: '',
        });
      } else {
        const errorData = await response.json();
        setSubmitStatus('error');
        setErrorMessage(errorData.detail || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    'Freight Broker',
    'Fleet Owner',
    'Independent Dispatcher',
    'Operations Manager',
    'Other',
  ];

  const fleetSizes = [
    '1-10 trucks',
    '11-50 trucks',
    '51-100 trucks',
    '100+ trucks',
    'Not applicable',
  ];

  return (
    <div className="bg-dark pt-20">
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Let's{' '}
              <span className="text-gradient-primary">Connect</span>
            </h1>
            <p className="text-lg text-zinc-400">
              Ready to transform your logistics operations? Fill out the form
              below and our team will reach out to schedule a personalized demo.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section bg-dark-50 pt-0">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Get in Touch
                </h2>
                <p className="text-zinc-400 mb-8">
                  Have questions? Our team is here to help you find the right
                  solution for your business.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Email</h3>
                      <a
                        href="mailto:sales@integratedsct.com"
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        sales@integratedsct.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Phone</h3>
                      <a
                        href="tel:+18005551234"
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        1-800-555-1234
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Office</h3>
                      <p className="text-zinc-400">
                        123 Logistics Way
                        <br />
                        Suite 500
                        <br />
                        Chicago, IL 60601
                      </p>
                    </div>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-white font-medium mb-4">Support Hours</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Monday - Friday</span>
                      <span className="text-zinc-300">24/7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Saturday - Sunday</span>
                      <span className="text-zinc-300">24/7</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    Emergency support available around the clock for all
                    customers.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card-highlight">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Request a Demo
                </h2>
                <p className="text-zinc-400 mb-8">
                  Fill out the form below and we'll get back to you within 24
                  hours.
                </p>

                {submitStatus === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Thank You!
                    </h3>
                    <p className="text-zinc-400 mb-6">
                      We've received your request and will be in touch within 24
                      hours.
                    </p>
                    <button
                      onClick={() => setSubmitStatus('idle')}
                      className="text-primary-500 hover:text-primary-400 font-medium"
                    >
                      Submit another request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {submitStatus === 'error' && (
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{errorMessage}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-zinc-300 mb-2"
                        >
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-600 transition-colors"
                          placeholder="John"
                          data-testid="contact-first-name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-zinc-300 mb-2"
                        >
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-600 transition-colors"
                          placeholder="Doe"
                          data-testid="contact-last-name"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-zinc-300 mb-2"
                        >
                          Work Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-600 transition-colors"
                          placeholder="john@company.com"
                          data-testid="contact-email"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-zinc-300 mb-2"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-600 transition-colors"
                          placeholder="(555) 123-4567"
                          data-testid="contact-phone"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-zinc-300 mb-2"
                      >
                        Company Name *
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-600 transition-colors"
                        placeholder="Acme Logistics"
                        data-testid="contact-company"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-zinc-300 mb-2"
                        >
                          Your Role
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-600 transition-colors"
                          data-testid="contact-role"
                        >
                          <option value="" className="bg-dark">
                            Select your role
                          </option>
                          {roles.map((role) => (
                            <option key={role} value={role} className="bg-dark">
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="fleetSize"
                          className="block text-sm font-medium text-zinc-300 mb-2"
                        >
                          Fleet Size
                        </label>
                        <select
                          id="fleetSize"
                          name="fleetSize"
                          value={formData.fleetSize}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-600 transition-colors"
                          data-testid="contact-fleet-size"
                        >
                          <option value="" className="bg-dark">
                            Select fleet size
                          </option>
                          {fleetSizes.map((size) => (
                            <option key={size} value={size} className="bg-dark">
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-zinc-300 mb-2"
                      >
                        How can we help?
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-primary-600 transition-colors resize-none"
                        placeholder="Tell us about your current challenges and what you're looking for in a TMS..."
                        data-testid="contact-message"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="contact-submit-btn"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Request Demo
                        </>
                      )}
                    </button>

                    <p className="text-xs text-zinc-500 text-center">
                      By submitting this form, you agree to our{' '}
                      <a href="/privacy" className="text-primary-500 hover:underline">
                        Privacy Policy
                      </a>{' '}
                      and{' '}
                      <a href="/terms" className="text-primary-500 hover:underline">
                        Terms of Service
                      </a>
                      .
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
