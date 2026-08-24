import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'

export default function Footer() {
  return (
    <>
      {/* Trustpilot Script */}
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
      />
      {/* Ramat Chat Widget */}
      <script
        src="https://ramat.echosystems.ng/embed.js"
        data-api="https://ramat.echosystems.ng"
        async
        defer
      ></script>
      <footer className="bg-gray-900 text-white relative">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-xl font-bold">
                  Echo Systems Network Ltd
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Leading provider of comprehensive financial technology solutions
                for modern businesses.
              </p>
            </div>
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/team"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Our Team
                  </Link>
                </li>
              </ul>
            </div>
            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Services
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Tax Management</li>
                <li>Payments Gateway</li>
                <li>Revenue Management</li>
                <li>Core Banking Solutions</li>
                <li>Financial Inclusion</li>
              </ul>
            </div>
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Contact
              </h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  <strong className="text-white">
                    Abuja Office:
                  </strong>
                  <br />
                  Plot 903 Tafawa Balewa Way, Garki, Abuja, Nigeria.
                </p>
                <p>
                  <strong className="text-white">
                    Kwara Office:
                  </strong>
                  <br />
                  16B Police Road, GRA, Ilorin, Kwara, Nigeria
                </p>
                <p className="mt-4">
                  <Link
                    href="/contact"
                    className="text-[#08a088] hover:opacity-80 transition-colors"
                  >
                    Get in Touch →
                  </Link>
                </p>
              </div>
            </div>
          </div>
          {/* Trustpilot Widget */}
          <div className="my-8">
            <div
              className="trustpilot-widget"
              data-locale="en-US"
              data-template-id="56278e9abfbbba0bdcd568bc"
              data-businessunit-id="6786c3d76fb402becde4d318"
              data-style-height="52px"
              data-style-width="100%"
              data-token="fec83677-5db5-47da-8f5c-d67da5fdff44"
            >
              <a
                href="https://www.trustpilot.com/review/echosystems.ng"
                target="_blank"
                rel="noopener noreferrer"
              >
                Trustpilot
              </a>
            </div>
          </div>
          {/* Footer Bottom Bar */}
          <div className="border-t border-gray-800 mt-4 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <p>
                Copyright &copy; {new Date().getFullYear()} Echo Systems Network Ltd.
                All rights reserved. Created with ♥ in Abuja.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <span>|</span>
                <Link
                  href="/terms-condition"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
