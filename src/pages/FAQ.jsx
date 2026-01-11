import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MetaTags from '@/components/common/MetaTags';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is Movies.to?',
        answer: 'Movies.to is a modern movie discovery platform that helps you explore trending, popular, and top-rated movies. You can search for movies, view detailed information, read reviews, and manage your personal watchlist.'
      },
      {
        question: 'Is Movies.to free to use?',
        answer: 'Yes! Movies.to is completely free to use. You can browse movies, search, and view details without creating an account. Creating a free account gives you additional features like watchlist management, reviews, and personalized recommendations.'
      },
      {
        question: 'Where does the movie data come from?',
        answer: 'All movie information, including titles, descriptions, cast, crew, ratings, and images, comes from The Movie Database (TMDB), a comprehensive community-built movie and TV database.'
      },
      {
        question: 'Do you host or stream movies?',
        answer: 'No, we do not host, store, or stream any movies. Movies.to is a discovery and information platform that helps you find movies and learn about them. We provide links to legal streaming services where available.'
      }
    ]
  },
  {
    category: 'Account & Authentication',
    questions: [
      {
        question: 'Do I need an account to use Movies.to?',
        answer: 'No, you can browse movies and view information without an account. However, creating a free account unlocks features like watchlist management, writing reviews, commenting, and personalized recommendations.'
      },
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the navigation bar. You can register with your email address or use OAuth to sign in with Google, GitHub, or Facebook for quick access.'
      },
      {
        question: 'What is OAuth login?',
        answer: 'OAuth allows you to sign in using your existing Google, GitHub, or Facebook account. This is faster and more secure than creating a new password, and we never see your password for these services.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes, we take security seriously. All passwords are encrypted using bcrypt hashing, data is transmitted over HTTPS, and we follow industry best practices for data protection. Read our Privacy Policy for more details.'
      },
      {
        question: 'I forgot my password. What should I do?',
        answer: 'Click the "Forgot Password" link on the login page. Enter your email address, and we\'ll send you instructions to reset your password.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can delete your account at any time from your Dashboard. Go to Settings and click "Delete Account". Note that this action is permanent and cannot be undone.'
      }
    ]
  },
  {
    category: 'Features',
    questions: [
      {
        question: 'What is a watchlist?',
        answer: 'Your watchlist is a personalized collection of movies you want to watch. Add movies to your watchlist by clicking the bookmark icon on any movie card or detail page. Access your watchlist from the navigation menu.'
      },
      {
        question: 'How do I search for movies?',
        answer: 'Use the search bar in the navigation menu to search for movies by title. Our search supports real-time autocomplete to help you find movies quickly. You can also use advanced filters on the Browse page.'
      },
      {
        question: 'Can I write reviews?',
        answer: 'Yes! Registered users can write reviews for any movie. Go to a movie\'s detail page, scroll to the Reviews section, and click "Write a Review". Share your thoughts and rate the movie.'
      },
      {
        question: 'How do comments work?',
        answer: 'You can leave comments on movie pages to discuss with other users. Comments support replies, creating threaded discussions. Be respectful and follow our community guidelines.'
      },
      {
        question: 'What are the different movie categories?',
        answer: 'We organize movies into several categories: Trending (currently popular), Popular (fan favorites), Top Rated (highest-rated films), and Upcoming (soon to be released). You can also browse by specific genres.'
      },
      {
        question: 'Can I filter movies by genre?',
        answer: 'Absolutely! Visit the Genres page to see all available genres, or use the Browse page filters to narrow down movies by genre, year, rating, and more.'
      }
    ]
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'Which browsers are supported?',
        answer: 'Movies.to works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.'
      },
      {
        question: 'Is there a mobile app?',
        answer: 'While we don\'t have a native mobile app yet, Movies.to is fully responsive and works great on mobile browsers. You can add it to your home screen for an app-like experience.'
      },
      {
        question: 'Why aren\'t movie posters loading?',
        answer: 'This could be due to a slow internet connection or temporary issues with image servers. Try refreshing the page. If the problem persists, please contact our support team.'
      },
      {
        question: 'How often is movie data updated?',
        answer: 'Movie data is synced regularly from TMDB. New releases, ratings, and other information are typically updated within 24 hours of changes on TMDB.'
      },
      {
        question: 'Can I use Movies.to offline?',
        answer: 'Movies.to requires an internet connection to fetch movie data and images. However, your watchlist is cached locally and may be viewable offline (though images may not load).'
      }
    ]
  },
  {
    category: 'Privacy & Legal',
    questions: [
      {
        question: 'How do you use my data?',
        answer: 'We only collect data necessary to provide our services and improve your experience. This includes your account information, watchlist, reviews, and usage analytics. We never sell your data to third parties. Read our Privacy Policy for full details.'
      },
      {
        question: 'Do you use cookies?',
        answer: 'Yes, we use cookies to keep you logged in, remember your preferences, and analyze site usage. You can manage cookie preferences in your browser settings.'
      },
      {
        question: 'What about GDPR compliance?',
        answer: 'We comply with GDPR and other privacy regulations. You have the right to access, correct, export, or delete your personal data at any time. Contact us to exercise these rights.'
      },
      {
        question: 'Are there age restrictions?',
        answer: 'You must be at least 13 years old to create an account. Users under 18 should have parental permission. Some movies may have age-appropriate content warnings.'
      }
    ]
  },
  {
    category: 'Troubleshooting',
    questions: [
      {
        question: 'I\'m having trouble logging in',
        answer: 'Make sure you\'re using the correct email and password. Try resetting your password if needed. Clear your browser cache and cookies. If you used OAuth to sign up, make sure to use the same OAuth provider to log in.'
      },
      {
        question: 'My watchlist isn\'t syncing',
        answer: 'Make sure you\'re logged in to your account. Watchlist changes sync automatically when you\'re online. If you\'re experiencing issues, try logging out and back in, or contact support.'
      },
      {
        question: 'How do I report a bug or issue?',
        answer: 'We appreciate bug reports! Please email us at support@movies.to with details about the issue, including your browser, device, and steps to reproduce the problem.'
      },
      {
        question: 'The site is loading slowly',
        answer: 'Slow loading can be caused by your internet connection, browser extensions, or high traffic. Try clearing your cache, disabling extensions, or using a different browser. Contact us if the problem persists.'
      }
    ]
  },
  {
    category: 'Contact & Support',
    questions: [
      {
        question: 'How can I contact support?',
        answer: 'Email us at support@movies.to for general inquiries and support. For privacy-related questions, contact privacy@movies.to. We aim to respond within 24-48 hours.'
      },
      {
        question: 'Can I suggest new features?',
        answer: 'Absolutely! We love hearing from our users. Send your feature suggestions to support@movies.to. While we can\'t implement every suggestion, we carefully consider all feedback.'
      },
      {
        question: 'How can I contribute to Movies.to?',
        answer: 'Movies.to is open source! You can contribute code, report bugs, suggest features, or help with documentation. Visit our GitHub repository to get started.'
      },
      {
        question: 'Do you have a newsletter?',
        answer: 'Not yet, but we\'re planning one! In the meantime, follow us on social media for updates about new features and popular movies.'
      }
    ]
  }
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex justify-between items-center text-left hover:text-red-500 transition-colors"
      >
        <span className="font-semibold text-white pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-300 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <MetaTags
        title={`${t('faq.title')} - Movies.to`}
        description={t('faq.subtitle')}
      />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="text-red-500 hover:text-red-400 transition-colors">
            {t('faq.backToHome')}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t('faq.title')}</h1>
          <p className="text-gray-300 text-lg">
            {t('faq.subtitle')}. Can't find what you're looking for?{' '}
            <a href="mailto:support@movies.to" className="text-red-500 hover:text-red-400 transition-colors">
              Contact us
            </a>
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, idx) => (
            <section key={idx}>
              <h2 className="text-2xl font-bold mb-4 text-red-500">{category.category}</h2>
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                {category.questions.map((faq, qIdx) => (
                  <FAQItem key={qIdx} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-gray-300 mb-4">
            We're here to help! If you couldn't find the answer you were looking for, please don't hesitate to reach out.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@movies.to"
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Contact Support
            </a>
            <Link
              to="/privacy"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {t('privacy.title')}
            </Link>
            <Link
              to="/terms"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {t('terms.title')}
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Last updated: December 19, 2025</p>
        </div>
      </div>
    </>
  );
}
