import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Phone, MapPin, Send, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import MetaTags from '@/components/common/MetaTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || t('contact.success') + ' ' + t('contact.successDetail'));
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        // Handle validation errors
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach(error => {
            toast.error(error.msg);
          });
        } else {
          toast.error(data.message || t('contact.error'));
        }
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error(t('contact.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <MetaTags
        title={t('contact.title') + ' - Movies.to'}
        description={t('contact.description')}
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
            {t('contact.getInTouch')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contact.questionOrSuggestion')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Form */}
          <Card className="md:col-span-2 shadow-lg border-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-red-500" />
                {t('contact.sendUsMessage')}
              </CardTitle>
              <CardDescription>
                {t('contact.fillFormDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.nameRequired')}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('contact.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.emailRequired')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contact.emailPlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contact.subjectRequired')}</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('contact.subjectPlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.messageRequired')}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('contact.messagePlaceholder')}
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <>{t('contact.sending')}</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t('contact.send')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Email */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <Mail className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.emailUs')}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('contact.emailUsDescription')}
                    </p>
                    <a
                      href="mailto:support@movies.to"
                      className="text-sm text-red-500 hover:underline"
                    >
                      {t('contact.supportEmail')}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <Clock className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.responseTime')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('contact.responseTimeDescription')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Support */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <Globe className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.onlineSupport')}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('contact.onlineSupportDescription')}
                    </p>
                    <Link
                      to="/faq"
                      className="text-sm text-red-500 hover:underline"
                    >
                      {t('contact.visitFAQ')}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12 shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-2xl">{t('contact.faqSection')}</CardTitle>
            <CardDescription>
              {t('contact.faqSectionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">{t('contact.howToCreateAccount')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('contact.howToCreateAccountAnswer')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('contact.isFree')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('contact.isFreeAnswer')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('contact.reportBug')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('contact.reportBugAnswer')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('contact.suggestFeature')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('contact.suggestFeatureAnswer')}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <Link to="/faq">
                <Button variant="outline">
                  {t('contact.viewAllFAQs')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-red-500 hover:text-red-400 transition-colors inline-flex items-center gap-2"
          >
            {t('contact.backToHome')}
          </Link>
        </div>
      </div>
    </>
  );
}
