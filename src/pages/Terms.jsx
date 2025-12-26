import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MetaTags from '@/components/common/MetaTags';

export default function Terms() {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <MetaTags
        title={`${t('terms.title')} - Movies.to`}
        description={t('terms.intro')}
      />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="text-red-500 hover:text-red-400 transition-colors">
            {t('about.backToHome')}
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">{t('terms.title')}</h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using Movies.to ("the Service"), you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
            <p className="leading-relaxed mb-3">
              Permission is granted to temporarily access the materials on Movies.to for personal,
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title,
              and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or public display</li>
              <li>Attempt to reverse engineer any software contained on Movies.to</li>
              <li>Remove any copyright or proprietary notations from the materials</li>
              <li>Transfer the materials to another person or mirror on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Content and Services</h2>
            <p className="leading-relaxed mb-3">
              Movies.to provides information about movies, including ratings, reviews, and metadata sourced
              from The Movie Database (TMDB). We do not host, store, or distribute any copyrighted content.
            </p>
            <p className="leading-relaxed">
              All movie data, images, and information are provided by TMDB and are subject to their terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Accounts</h2>
            <p className="leading-relaxed mb-3">
              When you create an account with us, you must provide accurate, complete, and current information.
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. User Content</h2>
            <p className="leading-relaxed mb-3">
              Users may post reviews, comments, and other content. By posting content, you grant us a
              non-exclusive, royalty-free, perpetual license to use, display, and distribute your content.
            </p>
            <p className="leading-relaxed">
              You agree not to post content that is offensive, illegal, or violates the rights of others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Disclaimer</h2>
            <p className="leading-relaxed">
              The materials on Movies.to are provided on an 'as is' basis. Movies.to makes no warranties,
              expressed or implied, and hereby disclaims all other warranties including warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Limitations</h2>
            <p className="leading-relaxed">
              In no event shall Movies.to or its suppliers be liable for any damages arising out of the use
              or inability to use the materials on Movies.to, even if Movies.to or an authorized representative
              has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Privacy</h2>
            <p className="leading-relaxed">
              Your use of Movies.to is also governed by our{' '}
              <Link to="/privacy" className="text-red-500 hover:text-red-400 transition-colors">
                Privacy Policy
              </Link>
              . Please review our Privacy Policy to understand our practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material
              changes via email or through the Service. Your continued use of the Service after such
              modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms, please contact us at:{' '}
              <a href="mailto:support@movies.to" className="text-red-500 hover:text-red-400 transition-colors">
                support@movies.to
              </a>
            </p>
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
