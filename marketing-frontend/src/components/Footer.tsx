import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Linkedin, Twitter, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const footerLinks = {
    product: [
      { name: 'Features', path: '/product#features' },
      { name: 'Pricing', path: '/product#pricing' },
      { name: 'Integrations', path: '/product#integrations' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Use Cases', path: '/use-cases' },
      { name: 'Contact', path: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
    ],
  };

  return (
    <footer className={`border-t ${isDark ? 'bg-dark-100 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className={`text-lg font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Integrated Supply Chain
                </span>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>Technologies</span>
              </div>
            </Link>
            <p className={`text-sm leading-relaxed max-w-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Transforming logistics operations with intelligent transportation
              management solutions. Built for freight brokers, fleet owners, and
              independent dispatchers.
            </p>
            <div className="flex gap-4">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-300'}`}
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-300'}`}
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@integratedsct.com"
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-300'}`}
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
            &copy; {currentYear} Integrated Supply Chain Technologies. All rights
            reserved.
          </p>
          <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
            Made with precision for the logistics industry
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
