import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Walking Challenge',
  description: 'Privacy Policy for Walking Challenge App',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <p className="text-sm text-gray-600 mb-6">Last updated: December 30, 2025</p>

        <div className="prose prose-lg max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700">
              Welcome to Walking Challenge (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our mobile application and related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Health and Fitness Data</h3>
            <p className="text-gray-700 mb-3">With your explicit permission, we collect:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Step count data</strong> from Apple HealthKit (iOS) or Google Health Connect (Android)</li>
              <li><strong>Distance traveled</strong> for activity tracking</li>
              <li><strong>Calories burned</strong> for insights and progress tracking</li>
              <li><strong>Activity timestamps</strong> to analyze your walking patterns</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Important:</strong> Health data is only accessed with your explicit consent through your device&apos;s health platform. 
              You can revoke this permission at any time through your device settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Account Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email address (via Google Sign-In)</li>
              <li>Display name and profile picture</li>
              <li>User ID for authentication</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.3 Usage Data</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Challenge participation and progress</li>
              <li>App interactions and feature usage</li>
              <li>Login timestamps and session data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Track your progress:</strong> Display daily step counts, weekly trends, and achievement milestones</li>
              <li><strong>Enable challenges:</strong> Allow you to join and compete in walking challenges with others</li>
              <li><strong>Generate insights:</strong> Provide personalized health insights and encouragement messages</li>
              <li><strong>Create leaderboards:</strong> Show rankings and comparative statistics (anonymized for privacy)</li>
              <li><strong>Improve our service:</strong> Analyze usage patterns to enhance app features and performance</li>
              <li><strong>Send notifications:</strong> Alert you about challenge updates and achievements (if enabled)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 mb-3">
              Your data is stored securely using industry-standard encryption:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Cloud storage:</strong> We use Google Firebase with encryption at rest and in transit</li>
              <li><strong>Authentication:</strong> Secured through Google OAuth 2.0 and NextAuth.js</li>
              <li><strong>Access controls:</strong> Strict database rules ensure users can only access their own data</li>
              <li><strong>Health data:</strong> Never shared with third parties; stored with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-3">
              We do <strong>NOT</strong> sell your personal information. We may share limited data only in these circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>With other users:</strong> Your display name and step counts in leaderboards and challenges (you control visibility)</li>
              <li><strong>Service providers:</strong> Firebase (Google Cloud) for hosting and authentication</li>
              <li><strong>Legal requirements:</strong> If required by law or to protect rights and safety</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Third-party services we use:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Google Firebase (data storage, authentication)</li>
              <li>Google Sign-In (authentication only)</li>
              <li>Apple HealthKit (iOS health data access - data stays on your device until synced)</li>
              <li>Google Health Connect (Android health data access)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-700 mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Revoke consent:</strong> Withdraw health data access permissions at any time</li>
              <li><strong>Opt-out:</strong> Disable notifications and promotional messages</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise these rights, contact us at the email provided below or use the in-app settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services. 
              When you delete your account, we will delete your personal data within 30 days, except where we 
              are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Children&apos;s Privacy (COPPA Compliance)</h2>
            <p className="text-gray-700">
              Our app is not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you believe we have inadvertently collected such information, 
              please contact us immediately, and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700">
              Your data may be transferred to and stored on servers located outside your country of residence, 
              including in the United States. By using our app, you consent to this transfer. We ensure appropriate 
              safeguards are in place to protect your data in compliance with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. GDPR Compliance (European Users)</h2>
            <p className="text-gray-700 mb-3">If you are located in the European Economic Area (EEA), you have additional rights under GDPR:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Right to be informed about data collection and use</li>
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Rights related to automated decision-making</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. CCPA Compliance (California Residents)</h2>
            <p className="text-gray-700 mb-3">California residents have specific rights under the California Consumer Privacy Act (CCPA):</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of sale of personal information (we do not sell data)</li>
              <li>Right to deletion of personal information</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Health Data Specific Provisions</h2>
            <p className="text-gray-700 mb-3">
              <strong>Apple HealthKit:</strong> Data from HealthKit is not shared with third parties for advertising or marketing. 
              HealthKit data is only used to provide health and fitness services within the app.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Google Health Connect:</strong> Health data is accessed only with your explicit permission and is used 
              solely for the purposes described in this policy.
            </p>
            <p className="text-gray-700">
              You can revoke health data access at any time through your device&apos;s health app settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Updates to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by 
              posting the new policy in the app and updating the &quot;Last updated&quot; date. Your continued use of the 
              app after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Contact Us</h2>
            <p className="text-gray-700 mb-3">
              If you have questions about this Privacy Policy or want to exercise your privacy rights, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@walkingchallenge.app<br />
                <strong>Response time:</strong> We aim to respond within 48 hours
              </p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              By using Walking Challenge, you acknowledge that you have read and understood this Privacy Policy 
              and agree to its terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
