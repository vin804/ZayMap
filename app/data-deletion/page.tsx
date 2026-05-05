export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Deletion Request</h1>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">How to Delete Your Data</h2>
          <p className="text-gray-600 mb-4">
            At ZayMap, we respect your privacy and your right to control your personal data. 
            You can request deletion of your account and associated data at any time.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Steps to Delete Your Account</h2>
          <ol className="list-decimal pl-6 text-gray-600 space-y-2">
            <li>Log into your ZayMap account</li>
            <li>Go to your Profile settings</li>
            <li>Click on "Delete Account" option</li>
            <li>Confirm the deletion request</li>
          </ol>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">What Data is Deleted</h2>
          <p className="text-gray-600 mb-2">When you delete your account, the following data is removed:</p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1">
            <li>Your profile information</li>
            <li>Your saved products and followed shops</li>
            <li>Your shop listings (if you have any)</li>
            <li>Any reviews you've submitted</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Retention</h2>
          <p className="text-gray-600">
            Some data may be retained for legal or security purposes for up to 30 days after deletion. 
            After this period, all data is permanently removed from our systems.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact for Data Deletion</h2>
          <p className="text-gray-600">
            If you need assistance with data deletion or have questions, contact us at:{' '}
            <a href="mailto:kyawhtetpaing19112000@gmail.com" className="text-blue-600 hover:underline">
              kyawhtetpaing19112000@gmail.com
            </a>
          </p>
        </section>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Data deletion is permanent and cannot be undone. 
            Please ensure you have saved any information you wish to keep before proceeding.
          </p>
        </div>
      </div>
    </div>
  );
}
