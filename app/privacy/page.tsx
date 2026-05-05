export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 mb-2">
            ZayMap collects information to provide better services to our users. This includes:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1">
            <li>Account information (name, email when provided)</li>
            <li>Location data for map features</li>
            <li>Shop and product information you create</li>
            <li>Usage data to improve our services</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Information</h2>
          <p className="text-gray-600">
            We use the information we collect to operate, maintain, and improve our services, 
            including to display shops on maps, process bookings, and provide customer support.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Information Sharing</h2>
          <p className="text-gray-600">
            We do not sell your personal information. We only share information with your consent, 
            to comply with laws, or to protect rights and safety.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Your Rights</h2>
          <p className="text-gray-600 mb-2">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1">
            <li>Access your personal data</li>
            <li>Request correction or deletion</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Contact Us</h2>
          <p className="text-gray-600">
            For privacy-related questions, contact us at: kyawhtetpaing19112000@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
