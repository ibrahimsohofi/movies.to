import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MetaTags from '@/components/common/MetaTags';

export default function Privacy() {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <MetaTags
        title={`${t('privacy.title')} - Movies.to`}
        description={t('privacy.intro')}
      />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="text-red-500 hover:text-red-400 transition-colors">
            {t('about.backToHome')}
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">{t('privacy.title')}</h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">Personal Information</h3>
            <p className="leading-relaxed mb-3">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address</li>
              <li>Username</li>
              <li>Password (encrypted)</li>
              <li>Profile information (optional)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">OAuth Information</h3>
            <p className="leading-relaxed mb-3">
              When you sign in with third-party services (Google, GitHub, Facebook), we receive:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your name</li>
              <li>Email address</li>
              <li>Profile picture</li>
              <li>Public profile information</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">Usage Data</h3>
            <p className="leading-relaxed mb-3">
              We automatically collect certain information when you use our Service:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Search queries</li>
              <li>Movies viewed and added to watchlist</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="leading-relaxed mb-3">
              We use the collected information for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain our Service</li>
              <li>To personalize your experience and recommendations</li>
              <li>To send you notifications about your account and watchlist</li>
              <li>To improve our Service and develop new features</li>
              <li>To detect and prevent fraud and abuse</li>
              <li>To comply with legal obligations</li>
              <li>To send you marketing communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Storage and Security</h2>
            <p className="leading-relaxed mb-3">
              We implement appropriate technical and organizational measures to protect your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Passwords are encrypted using bcrypt hashing</li>
              <li>Data is transmitted over secure HTTPS connections</li>
              <li>Access to personal data is restricted to authorized personnel only</li>
              <li>Regular security audits and updates</li>
              <li>Database backups are encrypted and stored securely</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">TMDB (The Movie Database)</h3>
            <p className="leading-relaxed mb-3">
              We use TMDB API to provide movie information. When you use our Service, requests are made to
              TMDB servers. Please review{' '}
              <a
                href="https://www.themoviedb.org/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                TMDB's Privacy Policy
              </a>.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">OAuth Providers</h3>
            <p className="leading-relaxed mb-3">
              When you use OAuth to sign in (Google, GitHub, Facebook), you are subject to their privacy policies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  GitHub Privacy Statement
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/privacy/policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  Facebook Privacy Policy
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">Analytics</h3>
            <p className="leading-relaxed">
              We may use analytics services to understand how users interact with our Service. These services
              may collect anonymous usage data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cookies and Tracking</h2>
            <p className="leading-relaxed mb-3">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze site usage and performance</li>
              <li>Personalize content and advertisements</li>
            </ul>
            <p className="leading-relaxed mt-3">
              You can control cookies through your browser settings, but this may affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Objection:</strong> Object to certain data processing activities</li>
            </ul>
            <p className="leading-relaxed mt-3">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@movies.to" className="text-red-500 hover:text-red-400 transition-colors">
                privacy@movies.to
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal data only as long as necessary for the purposes outlined in this policy.
              When you delete your account, we will delete or anonymize your personal data within 30 days,
              except where required by law to retain certain information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
            <p className="leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you are a parent or guardian and believe your
              child has provided us with personal data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. International Data Transfers</h2>
            <p className="leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure
              appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to
              review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4 mt-3">
              <li>
                Email:{' '}
                <a href="mailto:privacy@movies.to" className="text-red-500 hover:text-red-400 transition-colors">
                  privacy@movies.to
                </a>
              </li>
              <li>
                Support:{' '}
                <a href="mailto:support@movies.to" className="text-red-500 hover:text-red-400 transition-colors">
                  support@movies.to
                </a>
              </li>
            </ul>
          </section>

          <div className="pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Last updated: December 19, 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
