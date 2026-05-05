export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600">
            By accessing or using ZayMap, you agree to be bound by these Terms of Service. 
            If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Use of Service</h2>
          <p className="text-gray-600 mb-2">You agree to use ZayMap only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1">
            <li>Use the service in any way that violates applicable laws</li>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Interfere with other users' access to the service</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Accounts</h2>
          <p className="text-gray-600">
            When you create an account, you must provide accurate and complete information. 
            You are responsible for safeguarding your account and for any activities under your account.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Shop Listings</h2>
          <p className="text-gray-600">
            Users who create shop listings are responsible for the accuracy of their information. 
            ZayMap reserves the right to remove listings that violate our policies or terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Limitation of Liability</h2>
          <p className="text-gray-600">
            ZayMap shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use of the service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Changes to Terms</h2>
          <p className="text-gray-600">
            We may modify these terms at any time. Continued use of the service after changes 
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact</h2>
          <p className="text-gray-600">
            For questions about these Terms, contact us at: kyawhtetpaing19112000@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
