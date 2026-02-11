import Link from 'next/link';
import { Shield } from 'lucide-react';

export function ConsumerFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-7 w-7 text-[#4A90D9]" />
              <span className="text-lg font-bold text-gray-900">
                Repo<span className="text-[#4A90D9]">911</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Helping victims of wrongful vehicle repossession connect with licensed attorneys who can fight for their rights.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/claim" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  Free Case Review
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  Track My Case
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* For Attorneys */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">For Attorneys</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/attorney/login" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  Attorney Login
                </Link>
              </li>
              <li>
                <Link href="/attorney/register" className="text-sm text-gray-500 hover:text-[#4A90D9] transition-colors">
                  Join Our Network
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Repo911. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 text-center max-w-2xl">
              This website is not a law firm and does not provide legal advice. The information provided is for general informational purposes only. No attorney-client relationship is formed by using this site.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
